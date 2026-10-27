import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  symlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { ROOT, skillsDir } from "./paths";
import { displayName, gitEnv, homeDir, isHome, realPath, resolveGitProject } from "./scope";

export type InitResult = {
  ok: true;
  project: string;
  name: string;
  worktree: string;
  already_initialized: boolean;
  git_initialized: boolean;
  actions: string[];
  /** What init found and deliberately left alone, and why. Printed on stderr. */
  warnings: string[];
  message: string;
};

const OFFICE_MARKER = "<!-- agent-office -->";

/** Exported so the office's own AGENTS.md can be checked against it. */
export function buildOfficeSection(projectName: string): string {
  return `${OFFICE_MARKER}
## Agent Office

This repository (\`${projectName}\`) uses **Agent Office**, the shared working memory for agents on this machine. You arrive with no memory of earlier sessions: the office is how you pick up what the last agent knew, and how the next one picks up from you. Code goes in git; everything else worth keeping goes in the office.

**One agent, one repository.** Work only in this repository. If you are asked to work in another one, suggest that the human start a new agent there instead of switching.

### Start

1. Check in from inside this repository (any git worktree of it counts):
   \`\`\`bash
   office begin --by <your-tool>        # for example --by codex
   \`\`\`
   If you have been told not to change anything, run \`office peek --by <your-tool>\` instead.
2. The office gives back a numbered name for this run, like \`codex-4821\`. Use it on every later call (\`--by codex-4821\`, or \`export OFFICE_AUTHOR=codex-4821\`), so what you write is signed.
3. Read the briefing: the tools and skills this machine has, unfinished work, recent activity, and this project's memories. Prefer a listed tool or skill to building your own.
4. Start your first reply to the human with:
   > \`Working on ${projectName} within Agent Office (<numbered-name>).\`

### While you work

**Write while you still know it.** You will not know when your session ends.

- **Work log, the handoff:** \`office work open "<title>"\`, then \`office work note <id> "<where you got to>"\` as you go, and \`office work close <id> "<outcome>"\` once the work is finished, not when one step of it is. A note says where you stopped and what you would check next, not every file you touched.
- **Memories:** \`office remember "<fact>"\` for decisions and why, conventions, dead ends, and facts the next agent would otherwise rediscover. Add \`--global\` only for a rule that holds in every project. Never store secrets, \`.env\` contents, source dumps or progress chatter. If a memory is wrong, correct it and say why (\`office forget <id>\` removes it).
- **Finding things:** \`office context "<task>"\` before you start something, \`office search "<words>"\` for one fact. An empty result is real: nothing relevant is recorded.
- **Tools:** \`office tools add <name> --use "<command>" "<what it is>"\` for anything installed here that you would want again.
- **Issues:** when the office itself is in your way (not a bug in this repository), check \`office issues\`, then \`office issue open "<what>"\`, or add a note to the one already there.

\`office help\` lists every command.
`;
}

/**
 * Whether a file already carries the office section: init's own marker, or a
 * heading of that name a person wrote. A passing mention of the words does not
 * count, or a project could be reported set up with no startup steps in it.
 */
function hasOfficeInstructions(content: string): boolean {
  return content.includes(OFFICE_MARKER) || /^#{1,6}\s+agent[ -]office\s*$/im.test(content);
}

/** A line Claude Code reads as "include AGENTS.md here". */
function importsAgents(content: string): boolean {
  return content.split(/\r?\n/).some((line) => /^@(\.\/)?AGENTS\.md\s*$/.test(line.trim()));
}

type Entry =
  | { kind: "missing" }
  | { kind: "file" }
  | { kind: "dir" }
  | { kind: "link"; target: string; broken: boolean }
  | { kind: "other" };

/** What is at `path`, without following it if it is a link. */
function inspect(path: string): Entry {
  let stat;
  try {
    stat = lstatSync(path);
  } catch {
    return { kind: "missing" };
  }
  if (stat.isSymbolicLink()) {
    const target = resolve(dirname(path), readlinkSync(path));
    return { kind: "link", target, broken: !existsSync(path) };
  }
  if (stat.isFile()) return { kind: "file" };
  if (stat.isDirectory()) return { kind: "dir" };
  return { kind: "other" };
}

function isInside(path: string, root: string): boolean {
  const rel = relative(root, path);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !rel.startsWith(sep));
}

/** The deepest folder at or above `path` that exists, and the names below it. */
function nearestExisting(path: string): { existing: string; rest: string[] } {
  const rest: string[] = [];
  let current = path;
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) break;
    rest.unshift(basename(current));
    current = parent;
  }
  return { existing: current, rest };
}

/**
 * Git repositories somewhere below `dir`, a few levels down. A folder that
 * holds other projects (`~/Projects`) is not a project: its CLAUDE.md would be
 * read by every Claude agent in every repository under it. Dependency and
 * hidden folders are not looked in, and a link is never followed further than
 * asking whether it points at a repository. It looks a few folders down only:
 * projects are not kept buried deep.
 */
function nestedRepos(dir: string, depth = 3): string[] {
  const found: string[] = [];
  const walk = (current: string, left: number) => {
    let names: string[];
    try {
      names = readdirSync(current);
    } catch {
      return;
    }
    for (const name of names) {
      if (name.startsWith(".") || name === "node_modules") continue;
      const child = join(current, name);
      const kind = inspect(child).kind;
      if (kind === "link") {
        if (existsSync(join(child, ".git"))) found.push(child);
        continue;
      }
      if (kind !== "dir") continue;
      if (existsSync(join(child, ".git"))) found.push(child);
      else if (left > 1) walk(child, left - 1);
      if (found.length >= 3) return;
    }
  };
  walk(dir, depth);
  return found;
}

/** What git says about `dir`, for the cases where it says "not a repository". */
function gitComplaint(dir: string): string {
  try {
    const proc = Bun.spawnSync(["git", "-C", dir, "rev-parse", "--git-dir"], {
      stdout: "pipe",
      stderr: "pipe",
      env: gitEnv(),
    });
    return proc.exitCode === 0 ? "" : proc.stderr.toString("utf8").trim();
  } catch {
    return "git is not installed";
  }
}

/** Whether `dir` is inside a git repository's own data folder, or is a bare repository. */
function inGitData(dir: string): boolean {
  let proc;
  try {
    proc = Bun.spawnSync(
      ["git", "-C", dir, "rev-parse", "--is-inside-git-dir", "--is-bare-repository"],
      { stdout: "pipe", stderr: "pipe", env: gitEnv() },
    );
  } catch {
    return false;
  }
  if (proc.exitCode !== 0) return false;
  return proc.stdout.toString("utf8").split(/\s+/).includes("true");
}

/**
 * Whether a file has another name besides `alsoAllowed`: a hard link is the
 * same file under two names, and writing to one writes to both.
 */
function sharedElsewhere(path: string, alsoAllowed: string): boolean {
  const stat = statSync(path);
  if (stat.nlink <= 1) return false;
  return stat.nlink > 2 || !sameFile(path, alsoAllowed);
}

/** Whether two names are the same file (a hard link). */
function sameFile(a: string, b: string): boolean {
  try {
    const x = lstatSync(a);
    const y = lstatSync(b);
    return x.ino === y.ino && x.dev === y.dev;
  } catch {
    return false;
  }
}

/** Make a link unless the same link is already there; false when nothing was made. */
function linkOnce(target: string, path: string): boolean {
  try {
    symlinkSync(target, path);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
    const entry = inspect(path);
    if (entry.kind === "link" && realPath(entry.target) === realPath(resolve(dirname(path), target))) {
      return false;
    }
    throw err;
  }
}

/**
 * Append the section through one descriptor that refuses to follow a link, so
 * a link put in place since planning is not written through, and the bytes
 * already there stay exactly as they are. "present" when another init got
 * there first.
 */
function appendSection(path: string, claudePath: string, section: string): "appended" | "present" | "changed" {
  let fd: number;
  try {
    fd = openSync(path, constants.O_RDWR | constants.O_APPEND | constants.O_NOFOLLOW);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ELOOP") return "changed";
    throw err;
  }
  try {
    const stat = fstatSync(fd);
    if (stat.nlink > 1 && sharedElsewhere(path, claudePath)) return "changed";
    const existing = readFileSync(fd);
    if (hasOfficeInstructions(existing.toString("utf8"))) return "present";
    const tail = existing.subarray(-2).toString("latin1");
    const gap = tail.endsWith("\n\n") ? "" : tail.endsWith("\n") ? "\n" : "\n\n";
    writeSync(fd, `${gap}${section}`);
    return "appended";
  } finally {
    closeSync(fd);
  }
}

/** Which of `names` git would ignore in `dir`. */
function ignoredByGit(dir: string, names: string[]): string[] {
  const present = names.filter((name) => inspect(join(dir, name)).kind !== "missing");
  if (!present.length) return [];
  try {
    const proc = Bun.spawnSync(["git", "-C", dir, "check-ignore", ...present], {
      stdout: "pipe",
      stderr: "pipe",
      env: gitEnv(),
    });
    return proc.stdout.toString("utf8").split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Set up a repository to work with Agent Office (`office init`).
 *
 * It looks at everything first and writes only once it has decided, so a
 * refusal leaves the folder exactly as it was. It never edits, replaces or
 * removes a link it finds, never writes outside the folder it was given, and
 * never hides anything from git. What it leaves alone is said in `warnings`.
 * It records nothing in git's config: the project is always the folder git
 * reports, so a copied repository is a project of its own.
 *
 * Idempotent:
 * 1. Initializes a local Git repository if none exists yet (`git init`).
 * 2. Links `.claude/skills` and `.agents/skills` to the office skills folder.
 * 3. Creates or updates `AGENTS.md` with the session startup procedure, and
 *    links `CLAUDE.md -> AGENTS.md` if `CLAUDE.md` is not already present.
 * 4. Reports `already_initialized: true` when everything is already set up.
 */
export function initProject(
  targetDir = process.cwd(),
  opts: { skillsPath?: string } = {},
): InitResult {
  let raw = targetDir.trim();
  if (raw === "~") raw = homeDir();
  else if (raw.startsWith("~/")) raw = join(homeDir(), raw.slice(2));
  const dir = resolve(raw).replace(/\/+$/, "") || "/";
  const home = realPath(homeDir());
  const officeRoot = realPath(ROOT);

  // Compare real folders: a target reached through a link is the folder the
  // link points at, and one that does not exist yet is judged by its parent.
  const { existing, rest } = nearestExisting(dir);
  const target = rest.length ? join(realPath(existing), ...rest) : realPath(existing);

  if (target === home) {
    throw new Error("refusing to initialize $HOME — run `office init` inside a project folder");
  }

  const enclosing = resolveGitProject(existing);
  if (target === officeRoot || enclosing?.repoRoot === officeRoot) {
    if (target !== officeRoot && enclosing?.worktreeRoot !== target) {
      throw new Error(
        `${dir} is inside the agent-office checkout, which is already set up; ` +
          "run `office init` in a project's own repository",
      );
    }
    return {
      ok: true,
      project: officeRoot,
      name: basename(officeRoot),
      worktree: target,
      already_initialized: true,
      git_initialized: false,
      actions: [],
      warnings: [],
      message: `Agent Office · ${basename(officeRoot)} (${officeRoot}) is the office checkout itself and is already set up.`,
    };
  }

  if (inGitData(existing)) {
    throw new Error(
      `${dir} is inside a git repository's own data folder (or a bare repository); ` +
        "run `office init` in a working folder of that repository",
    );
  }

  if (enclosing && isHome(enclosing.repoRoot) && enclosing.worktreeRoot !== home) {
    throw new Error(
      `${dir} is a worktree of the git repository at your home folder (${home}); Agent Office ` +
        "never sets up the home folder's repository, so agents there would get no project"
    );
  }

  if (enclosing && enclosing.worktreeRoot !== target) {
    if (enclosing.worktreeRoot === home) {
      throw new Error(
        `${dir} is inside a git repository at your home folder (${home}); Agent Office never ` +
          `sets up the home folder. To make ${dir} its own project, run \`git init ${dir}\` first`,
      );
    }
    throw new Error(
      `${dir} is inside the git repository ${enclosing.worktreeRoot}. To set up that ` +
        `repository, run \`office init ${enclosing.worktreeRoot}\`. To make ${dir} its own ` +
        `project, run \`git init ${dir}\` first`,
    );
  }

  if (!enclosing) {
    // A `.git` git cannot read: `git init` would write through a link, or into
    // a repository git refuses to trust. A plain folder it simply repairs.
    const dotGit = inspect(join(target, ".git"));
    const complaint = dotGit.kind === "missing" ? "" : gitComplaint(target);
    if (/dubious ownership/i.test(complaint)) {
      throw new Error(
        `${dir} is a git repository owned by another user, which git will not use until it is ` +
          "marked safe (`git config --global --add safe.directory <path>`); init changed nothing",
      );
    }
    if (dotGit.kind === "link" || dotGit.kind === "file") {
      throw new Error(
        `${dir}/.git is a ${dotGit.kind === "link" ? "link" : "file"} that git cannot read as a ` +
          "repository; init would write through it, so it changed nothing. Fix or remove it first",
      );
    }
    const held = nestedRepos(target);
    if (held.length) {
      throw new Error(
        `${dir} holds other git repositories (${held.join(", ")}); a folder of projects is not ` +
          "a project, and its CLAUDE.md would reach every agent under it. Run `office init` " +
          "in each project instead",
      );
    }
  }

  // Everything below is decided before anything is written.
  const worktreeRoot = enclosing?.worktreeRoot ?? target;
  const actions: string[] = [];
  const warnings: string[] = [];
  const targetSkills = resolve(opts.skillsPath ?? skillsDir());

  const skillLinks: { harnessDir: string; kind: Entry["kind"]; real: string }[] = [];
  // `.claude` may be a link to `.agents` (or the reverse): one real folder gets one link.
  const plannedReal = new Set<string>();
  for (const harnessDir of [".claude", ".agents"]) {
    const parent = join(worktreeRoot, harnessDir);
    const entry = inspect(parent);
    if (entry.kind === "link") {
      const real = realPath(entry.target);
      const inside = isInside(real, realPath(worktreeRoot));
      if (entry.broken || !inside || !statSync(parent).isDirectory()) {
        warnings.push(
          `${harnessDir} is a link to ${entry.target}` +
            (entry.broken ? " (broken)" : "") +
            (inside ? "" : ", outside this repository") +
            `; nothing was created in it. Link ${harnessDir}/skills there yourself if that is ` +
            "what you want",
        );
        continue;
      }
    } else if (entry.kind !== "missing" && entry.kind !== "dir") {
      warnings.push(`${harnessDir} exists and is not a folder; ${harnessDir}/skills was not linked`);
      continue;
    }
    const linkPath = join(parent, "skills");
    const realLink = join(realPath(parent), "skills");
    if (plannedReal.has(realLink)) continue;
    plannedReal.add(realLink);
    const existingLink = inspect(linkPath);
    if (existingLink.kind === "missing") {
      skillLinks.push({ harnessDir, kind: entry.kind, real: realPath(parent) });
    }
    else if (existingLink.kind !== "link" || realPath(existingLink.target) !== realPath(targetSkills)) {
      warnings.push(
        `${harnessDir}/skills already exists and is not a link to the office's skills; it was ` +
          "left alone, so the office skills are not loaded from it",
      );
    }
  }

  const agentsPath = join(worktreeRoot, "AGENTS.md");
  const agents = inspect(agentsPath);
  let agentsWrite: "create" | "append" | null = null;
  let sectionPresent = false;
  if (agents.kind === "missing") {
    agentsWrite = "create";
  } else if (agents.kind === "file") {
    if (hasOfficeInstructions(readFileSync(agentsPath, "utf8"))) sectionPresent = true;
    else if (sharedElsewhere(agentsPath, join(worktreeRoot, "CLAUDE.md"))) {
      warnings.push(
        "AGENTS.md is a hard link: the same file also has another name, possibly outside this " +
          "repository, so init did not change it. Add the Agent Office section yourself, or " +
          "replace it with a copy and rerun `office init`",
      );
    } else agentsWrite = "append";
  } else if (agents.kind === "link") {
    const toOffice = realPath(agents.target) === realPath(join(officeRoot, "AGENTS.md"));
    if (toOffice) sectionPresent = true;
    warnings.push(
      toOffice
        ? "AGENTS.md is a link to the office's own AGENTS.md (the old setup), so agents here " +
            "read the office's full guidance; left as it is. To use a project file instead, " +
            "remove the link and rerun `office init`"
        : `AGENTS.md is a link to ${agents.target}${agents.broken ? " (broken)" : ""}; init did ` +
            "not change it. Add the Agent Office section there yourself, or replace the link " +
            "with a file and rerun `office init`",
    );
  } else {
    warnings.push("AGENTS.md exists and is not a file; it was left alone");
  }

  const claudePath = join(worktreeRoot, "CLAUDE.md");
  const claude = inspect(claudePath);
  // A link to a folder is no use to Claude Code, so only a file (or a link) gets one.
  const linkClaude = claude.kind === "missing" && (agents.kind !== "dir" && agents.kind !== "other");
  if (claude.kind === "link") {
    if (realPath(claude.target) !== realPath(agentsPath) && claude.target !== agentsPath) {
      warnings.push(
        `CLAUDE.md is a link to ${claude.target}${claude.broken ? " (broken)" : ""}, not to ` +
          "AGENTS.md. Claude Code reads CLAUDE.md, so Claude agents here may not see the " +
          "Agent Office steps; init left it alone",
      );
    }
  } else if (claude.kind === "file" && !sameFile(claudePath, agentsPath)) {
    const content = readFileSync(claudePath, "utf8");
    if (!hasOfficeInstructions(content) && !importsAgents(content)) {
      warnings.push(
        "CLAUDE.md exists and has no Agent Office startup steps. Claude Code reads CLAUDE.md, " +
          "not AGENTS.md — add a line `@AGENTS.md` to it",
      );
    }
  }

  // Writes.
  // Written at the real folder that was checked, not through the path as typed.
  try {
    mkdirSync(target, { recursive: true });
  } catch (err) {
    throw new Error(
      `could not create ${dir} (${(err as NodeJS.ErrnoException).code}): it, or a folder on the ` +
        "way to it, is a file or a broken link; init changed nothing",
    );
  }
  let gitInitialized = false;
  let git = enclosing;
  if (!git) {
    const initProc = Bun.spawnSync(["git", "init", target], {
      stdout: "pipe",
      stderr: "pipe",
      // English, so "Reinitialized" can be read below whatever the user's language.
      env: { ...gitEnv(), LC_ALL: "C" },
    });
    // Another init may have made the repository a moment ago: git then fails, or
    // succeeds saying it reinitialized one. Neither is this init's doing.
    const reinitialized = /^Reinitialized existing/.test(initProc.stdout.toString("utf8"));
    git = initProc.exitCode === 0 && !reinitialized ? null : resolveGitProject(target);
    // The other init may still be writing its repository: look again briefly.
    for (let tries = 0; initProc.exitCode !== 0 && !git && tries < 10; tries += 1) {
      Bun.sleepSync(50);
      git = resolveGitProject(target);
    }
    // A `.git` git could not read before, which `git init` has now repaired.
    if (reinitialized && git) actions.push("repaired git repository");
    if (initProc.exitCode !== 0 && !git) {
      const err = initProc.stderr.toString("utf8").trim() || "git init failed";
      throw new Error(`could not initialize git repository in ${dir}: ${err}`);
    }
    if (!git) {
      gitInitialized = true;
      actions.push("initialized git repository");
      git = resolveGitProject(target);
    }
    if (!git) {
      throw new Error(`git repository initialized at ${dir}, but could not resolve git paths`);
    }
  }

  const { repoRoot } = git;
  const projectName = displayName(repoRoot);

  // 1. Link `.claude/skills` and `.agents/skills` to the office skills directory.
  // Each place is looked at again first: another init, or the user, may have
  // got there since the plan was made.
  // The link is made inside the real folder that was checked, so a `.claude`
  // that started as a link is not followed again. A plain `.claude` swapped for
  // a link in the instant between check and link cannot be stopped from here
  // (there is no link-at-a-folder-handle call); it is looked at again afterwards
  // and named.
  for (const { harnessDir, kind, real } of skillLinks) {
    const parent = join(worktreeRoot, harnessDir);
    const changed = () => warnings.push(`${harnessDir} changed while init ran; ${harnessDir}/skills was not linked`);
    if (kind === "missing") {
      try {
        mkdirSync(real);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== "EEXIST") throw err;
        // Another init may have made the same plain folder; a link is a change.
        if (inspect(parent).kind !== "dir") {
          changed();
          continue;
        }
      }
    } else if (inspect(parent).kind !== kind || realPath(parent) !== real) {
      changed();
      continue;
    }
    if (linkOnce(targetSkills, join(real, "skills"))) actions.push(`linked ${harnessDir}/skills`);
    if (realPath(parent) !== real) {
      warnings.push(
        `${harnessDir} changed while init ran; check where ${harnessDir}/skills was linked ` +
          `(${join(real, "skills")})`,
      );
    }
  }

  // 2. Ensure `AGENTS.md` has the Agent Office startup procedure.
  if (agentsWrite === "create") {
    try {
      writeFileSync(agentsPath, `# ${projectName}\n\n${buildOfficeSection(projectName)}`, {
        encoding: "utf8",
        flag: "wx",
      });
      actions.push("created AGENTS.md");
      sectionPresent = true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      if (inspect(agentsPath).kind === "file" && hasOfficeInstructions(readFileSync(agentsPath, "utf8"))) {
        sectionPresent = true;
      } else {
        warnings.push("AGENTS.md appeared while init ran and was left alone; rerun `office init`");
      }
    }
  } else if (agentsWrite === "append") {
    const result = appendSection(agentsPath, claudePath, buildOfficeSection(projectName));
    if (result === "appended") actions.push("updated AGENTS.md with Agent Office startup");
    if (result === "changed") {
      warnings.push(
        "AGENTS.md became a link, or gained another name, while init ran and was left alone; " +
          "rerun `office init`",
      );
    } else sectionPresent = true;
  }

  // 3. Point `CLAUDE.md` at `AGENTS.md` if `CLAUDE.md` does not exist yet.
  if (linkClaude && linkOnce("AGENTS.md", claudePath)) actions.push("linked CLAUDE.md -> AGENTS.md");

  // init never writes an ignore rule, but git may already have one that hides
  // the instructions (a template, core.excludesFile, a .gitignore).
  for (const name of ignoredByGit(worktreeRoot, ["AGENTS.md", "CLAUDE.md"])) {
    warnings.push(
      `git ignores ${name} here (a .gitignore, core.excludesFile or a git template), so it will ` +
        `not be committed; add it with \`git add -f ${name}\` or remove that rule`,
    );
  }

  const alreadyInitialized = actions.length === 0 && sectionPresent;
  // init never edits .git/info/exclude: an ignore line it wrote could go on
  // hiding a file the user later puts at that path. The skills links point at
  // this machine's office checkout, so the user decides whether git sees them.
  const skillsNote = skillLinks.length
    ? " The skills links point at this machine's office folder and show in `git status`; " +
      "add .claude/skills and .agents/skills to your .gitignore if you do not want to see them."
    : "";
  // In a linked worktree the files land in that worktree, on its branch.
  const linked = git.gitDir !== git.gitCommonDir;
  const where = linked ? worktreeRoot : repoRoot;
  if (linked && !alreadyInitialized) {
    warnings.push(
      `${worktreeRoot} is a worktree of ${repoRoot}: the files were written here, on this ` +
        "worktree's branch. Commit them on that branch, or run `office init` in the main checkout",
    );
  }
  const message = !sectionPresent
    ? `Agent Office · ${projectName} (${where}) is not fully set up: AGENTS.md has no Agent ` +
      `Office section${actions.length ? ` (done: ${actions.join(", ")})` : ""} — see the warnings.`
    : alreadyInitialized
      ? `Agent Office · ${projectName} (${where}) is already set up and linked.`
      : `Agent Office · set up ${projectName} (${where}) — ${actions.join(", ")}.${skillsNote}`;

  return {
    ok: true,
    project: repoRoot,
    name: projectName,
    worktree: worktreeRoot,
    already_initialized: alreadyInitialized,
    git_initialized: gitInitialized,
    actions,
    warnings,
    message,
  };
}
