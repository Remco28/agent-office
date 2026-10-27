import type { Database } from "bun:sqlite";
import { AsyncLocalStorage } from "node:async_hooks";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { ROOT } from "./paths";

export type GitProjectInfo = {
  /** Canonical main repository root (resolves through git worktrees). */
  repoRoot: string;
  /** Top-level directory of the current checkout or worktree. */
  worktreeRoot: string;
  /** Absolute path to the shared .git directory. */
  gitCommonDir: string;
  /** This checkout's own git directory; differs from `gitCommonDir` in a linked worktree. */
  gitDir: string;
};

function clean(path: string): string {
  return resolve(path).replace(/\/+$/, "") || "/";
}

/** The path with every symlink resolved, or the path itself when it does not exist. */
export function realPath(path: string): string {
  try {
    return clean(realpathSync(path));
  } catch {
    return clean(path);
  }
}

/**
 * A git repository whose top is the home folder is never a project. A dotfiles
 * repo at `~` would otherwise swallow every folder under home that is not its
 * own repo, and file all of them as one project called "home".
 */
export function isHome(path: string): boolean {
  return realPath(path) === realPath(homeDir());
}

/** The home folder. `$HOME` first: Bun's `homedir()` does not see it change. */
export function homeDir(): string {
  return process.env.HOME?.trim() || homedir();
}

let gitCalls = 0;

/** How many git subprocesses this process has started; for tests of read cost. */
export function gitCallCount(): number {
  return gitCalls;
}

/**
 * Variables that tell git which repository to use instead of the folder it is
 * run in (git's own `rev-parse --local-env-vars`, plus the injected-config and
 * ceiling ones). An agent's shell can carry them from some other job; the folder
 * decides which project it is, so office's git calls never see them.
 */
const REPO_ENV = new Set([
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_CEILING_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_CONFIG",
  "GIT_CONFIG_COUNT",
  "GIT_CONFIG_PARAMETERS",
  "GIT_DIR",
  "GIT_GRAFT_FILE",
  "GIT_IMPLICIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_NAMESPACE",
  "GIT_NO_REPLACE_OBJECTS",
  "GIT_OBJECT_DIRECTORY",
  "GIT_PREFIX",
  "GIT_REPLACE_REF_BASE",
  "GIT_SHALLOW_FILE",
  "GIT_WORK_TREE",
]);

/** The environment for every git subprocess office starts. */
export function gitEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (value === undefined || REPO_ENV.has(name) || /^GIT_CONFIG_(KEY|VALUE)_\d+$/.test(name)) continue;
    env[name] = value;
  }
  return env;
}

function git(args: string[]): { ok: boolean; out: string } {
  gitCalls += 1;
  // No git on PATH means no folder is a repository; it is not a reason to fail.
  let proc;
  try {
    proc = Bun.spawnSync(["git", ...args], { stdout: "pipe", stderr: "pipe", env: gitEnv() });
  } catch {
    return { ok: false, out: "" };
  }
  return { ok: proc.exitCode === 0, out: proc.stdout.toString("utf8").trim() };
}

/**
 * Fast walk up the directory tree to see if `.git` exists before spawning a
 * git subprocess. Non-existent or non-git paths return false immediately.
 */
export function hasGitAncestor(dir: string): boolean {
  if (!existsSync(dir)) return false;
  // The real folder's parents, not the link's: git follows the link too.
  let current = realPath(dir);
  while (true) {
    if (existsSync(join(current, ".git"))) return true;
    const parent = dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

/**
 * The one path every checkout of a repository shares, when its git folder is
 * not the usual `<main checkout>/.git`. Git's own config says which layout it is:
 * a bare repository has no main checkout, so the repository folder itself is the
 * key; a submodule records its checkout in `core.worktree`; a repo made with
 * `--separate-git-dir` records nothing, so the git folder is the key. Each of
 * these gives the same answer from every worktree, which is the point.
 */
function sharedRoot(gitCommonDir: string): string {
  const inWorktree = worktreeSubmodule(gitCommonDir);
  if (inWorktree) return inWorktree;
  return configuredRoot(gitCommonDir);
}

function configuredRoot(gitCommonDir: string): string {
  const config = join(gitCommonDir, "config");
  const bare = git(["config", "--file", config, "--bool", "--get", "core.bare"]);
  if (bare.ok && bare.out === "true") return gitCommonDir;
  const worktree = git(["config", "--file", config, "--get", "core.worktree"]);
  if (worktree.ok && worktree.out) return clean(resolve(gitCommonDir, worktree.out));
  return gitCommonDir;
}

/**
 * A submodule checked out in a worktree of its superproject has a git folder of
 * its own, `<G>/worktrees/<name>/modules/<m>`, and git records that worktree's
 * folder as its checkout. It is the same submodule as `<G>/modules/<m>`, so it
 * takes that one's key: the main checkout's. With no main-checkout copy (a bare
 * superproject, or one never initialised there) the key is the superproject's
 * root plus where the submodule sits inside the worktree, which is what the
 * main checkout will give once it has the submodule too. Anything that only
 * looks like this layout (no `gitdir` file for that worktree) returns null.
 * Known limit, accepted (review round 4, J3): a superproject made with
 * `--separate-git-dir` records nowhere where its main checkout is, so its
 * worktree submodule keys under the git folder and changes key once the main
 * checkout initialises the submodule too.
 */
function worktreeSubmodule(gitCommonDir: string): string | null {
  const match = /^(.*)\/worktrees\/([^/]+)\/modules\/(.+)$/.exec(gitCommonDir);
  if (!match) return null;
  const [, superGit, name, module] = match;
  const worktreeAdmin = join(superGit, "worktrees", name);
  let gitdirFile: string;
  try {
    gitdirFile = readFileSync(join(worktreeAdmin, "gitdir"), "utf8").trim();
  } catch {
    return null;
  }
  // The main checkout's copy decides only while it still names its checkout:
  // `git submodule deinit` keeps the config but drops core.worktree.
  const main = join(superGit, "modules", module);
  if (existsSync(join(main, "config"))) {
    const worktree = git(["config", "--file", join(main, "config"), "--get", "core.worktree"]);
    if (worktree.ok && worktree.out) return clean(resolve(main, worktree.out));
  }
  const superRoot = basename(superGit) === ".git" ? dirname(superGit) : configuredRoot(superGit);
  // The file may hold a relative path (worktree.useRelativePaths): it is relative to its own folder.
  const top = realPath(dirname(resolve(worktreeAdmin, gitdirFile)));
  const inside = relative(top, realPath(configuredRoot(gitCommonDir)));
  if (!inside || inside === ".." || inside.startsWith(`..${sep}`) || inside.startsWith(sep)) {
    return clean(join(superRoot, module));
  }
  return clean(join(superRoot, inside));
}

/**
 * Resolve the canonical Git project for `dir`.
 *
 * Inside a git worktree (such as one created by T3 Code), `--show-toplevel`
 * returns the temporary worktree folder while `--git-common-dir` points back
 * to the main repository's `.git` directory. Using `--git-common-dir` ensures
 * every worktree maps to the same canonical project root.
 */
export function resolveGitProject(dir: string): GitProjectInfo | null {
  if (!hasGitAncestor(dir)) return null;
  const result = git([
    "-C",
    dir,
    "rev-parse",
    "--path-format=absolute",
    "--show-toplevel",
    "--git-common-dir",
    "--absolute-git-dir",
  ]);
  if (!result.ok) return null;
  const lines = result.out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 3) return null;
  const worktreeRoot = clean(lines[0]);
  const gitCommonDir = clean(lines[1]);
  const gitDir = clean(lines[2]);
  const repoRoot =
    basename(gitCommonDir) === ".git" ? clean(dirname(gitCommonDir)) : sharedRoot(gitCommonDir);
  return { repoRoot, worktreeRoot, gitCommonDir, gitDir };
}

/**
 * Infer the project from a working directory when no `--project` flag or
 * `OFFICE_PROJECT` variable was provided.
 *
 * Sitting inside the `agent-office` checkout itself (`ROOT`) does not infer a
 * project — the office checkout is the historic doorway, so working on the
 * office itself still uses `--project .` (unless working in a separate git
 * worktree). A repository rooted at the home folder is not a project either.
 * Any other git repository or worktree resolves to its canonical project root.
 */
export function detectCwdProject(cwd = process.cwd()): string | null {
  const info = resolveGitProject(realPath(cwd));
  if (!info) return null;
  const officeRoot = realPath(ROOT);
  const canonical = info.repoRoot;
  if (canonical === officeRoot && info.worktreeRoot === officeRoot) {
    return null;
  }
  // Home's own checkout is never a project, whichever folder git keeps its data in.
  if (isHome(canonical) || isHome(info.worktreeRoot)) return null;
  return canonical;
}

/**
 * Answers already worked out during this request. A briefing asks for the same
 * projects several times over, and each answer can cost a git subprocess, so
 * the daemon gives every request its own memo (see `withProjectMemo`). It lives
 * only as long as the request, so it is never stale, and two requests running
 * at once never share one.
 */
const projectMemo = new AsyncLocalStorage<Map<string, string>>();

export function withProjectMemo<T>(fn: () => T): T {
  return projectMemo.run(new Map(), fn);
}

/**
 * Turn a user-supplied project reference into a stable key. A path stays a
 * path (expanded, absolute, no trailing slash); anything else is kept as a
 * plain name so the slug-style values written before the split still work.
 *
 * A path that exists inside a git checkout — its top, any subfolder, or a
 * symlink to either — normalizes to that repository's canonical project, so a
 * repo, its subfolders and its worktrees share one project's memories and work
 * log. A path that does not exist, or is in no repository, stays as typed.
 */
export function normalizeProject(raw: string): string {
  let value = raw.trim();
  if (!value) return "";
  if (value === "~") value = homedir();
  else if (value.startsWith("~/")) value = join(homedir(), value.slice(2));
  // "." and ".." are paths too. Without this, `--project .` was stored as a
  // project literally named ".", which matches nothing a later read names.
  if (value.includes("/") || value === "." || value === "..") value = resolve(value);
  const trimmed = value.replace(/\/+$/, "") || "/";
  // A bare name is never looked up on disk: `src` would otherwise resolve
  // against whatever folder the daemon happens to run in.
  if (!looksLikePath(trimmed) || !existsSync(trimmed)) return trimmed;
  const memo = projectMemo.getStore();
  const cached = memo?.get(trimmed);
  if (cached !== undefined) return cached;
  const info = resolveGitProject(realPath(trimmed));
  const canonical = info?.repoRoot ?? null;
  const result = canonical && !isHome(canonical) && !isHome(info!.worktreeRoot) ? canonical : trimmed;
  memo?.set(trimmed, result);
  return result;
}

function looksLikePath(value: string): boolean {
  return value.includes("/");
}

/** The part of a project key two different spellings can agree on. */
/**
 * What to tell a session that never named a project.
 *
 * Reads in that state resolve to the everywhere notes and nothing else, so the
 * honest answer to "what do you know about this?" is "nothing yet" — never a
 * list of other projects' notes. The note is what turns that silence into
 * something an agent can act on instead of concluding the office is empty.
 */
export const NO_PROJECT_NOTE =
  "no project declared — only the memories that apply everywhere are in scope; " +
  "start the agent inside the project's repository, or name one with `--project <path>`";

/**
 * What to tell a session with no project that asks for unfinished work.
 *
 * The answer used to be every project's loose ends, which is the read the
 * scope rule exists to refuse. It is not silence either, because the items
 * filed with no project at all belong to nobody — showing those cannot hand
 * anyone the wrong project's work, and it is the only way such a handoff is
 * ever found again.
 */
export const UNCLAIMED_WORK_NOTE =
  "no project declared — showing only the work filed with no project of its own; " +
  "nothing filed under a project is included. Start the agent inside the " +
  "project's repository, or name one with `--project <path>`";

/**
 * What to say at the moment a write lands with no project. The agent can fix
 * this for free right now, by naming one; later it is a handoff nobody looks
 * for. Said on the way in, not read out of a report afterwards.
 */
export const UNCLAIMED_WRITE_NOTE =
  "this has no project, so it is filed as unclaimed: only a reader who asks " +
  "for the unclaimed will see it. Pass --project <path>, or it will keep " +
  "filing that way";

/**
 * What to say at the moment a memory lands with no project and no `--global`.
 * It is the sibling of the note above: the same trap, one record over.
 */
export const UNATTRIBUTED_MEMORY_NOTE =
  "this memory has no project and is not marked --global, so no project-scoped " +
  "read will find it. Pass --project <path>, or --global if it applies everywhere";

/**
 * What to tell a session that has never been here before and is being handed
 * the recent trail. Its own visit cannot be the watermark — it does not have
 * one — so the frame is stated rather than implied, and every event names the
 * project it came from.
 */
export const RECENT_ACTIVITY_NOTE =
  "you have no previous visit of your own, so this is this project's most recent " +
  "activity rather than what changed since you were last here";

/**
 * The name a person knows a project by. Usually the key's last folder; but a
 * key that is git's own folder (`proj/.bare`, `proj/.git`) is named after the
 * folder holding it, and a bare `proj.git` is `proj`. Keys are never changed.
 */
export function displayName(project: string): string {
  const last = basename(project);
  if (last === ".bare" || last === ".git") return basename(dirname(project)) || project;
  return last.replace(/\.git$/, "") || last || project;
}

export function projectKey(raw: string): string {
  return basename(normalizeProject(raw)).toLowerCase();
}

/** Every distinct project value already recorded, in memories and in the log. */
export function knownProjects(db: Database): string[] {
  const out = new Set<string>();
  for (const table of ["memories", "work"]) {
    const rows = db
      .query(`SELECT DISTINCT project AS p FROM ${table} WHERE project IS NOT NULL`)
      .all() as { p: string }[];
    for (const row of rows) out.add(row.p);
  }
  return [...out];
}

/**
 * Project values that refer to the same project as `project`.
 *
 * Two real paths must match exactly — `~/work/api` and `~/personal/api` are
 * different projects. A bare name (what the old `source` column held, e.g.
 * `fencing-team-draft-game`) is matched on its last segment, so a legacy row
 * still answers when you name the folder it lives in.
 */
export function matchingProjects(db: Database, project: string): string[] {
  const wanted = normalizeProject(project);
  if (!wanted) return [];
  const key = projectKey(wanted);
  return knownProjects(db).filter((candidate) => {
    const normalized = normalizeProject(candidate);
    if (normalized === wanted) return true;
    if (looksLikePath(candidate) && looksLikePath(wanted)) return false;
    return key.length > 0 && projectKey(candidate) === key;
  });
}

/**
 * `AND (scope = 'global' OR project IN (...))`.
 *
 * An empty match list is the everywhere notes, not "no filter": the only way
 * to reach the whole store is to ask for it by name (`listMemories`), never by
 * leaving the project out. Keeping that rule here means scope is decided in
 * exactly one place.
 */
export function scopeClause(matches: string[]): { sql: string; params: string[] } {
  if (!matches.length) return { sql: " AND scope = 'global'", params: [] };
  const placeholders = matches.map(() => "?").join(",");
  return {
    sql: ` AND (scope = 'global' OR project IN (${placeholders}))`,
    params: matches,
  };
}
