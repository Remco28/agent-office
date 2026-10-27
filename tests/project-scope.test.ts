import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initProject } from "../src/init";
import { ROOT } from "../src/paths";
import {
  detectCwdProject,
  displayName,
  gitCallCount,
  normalizeProject,
  withProjectMemo,
} from "../src/scope";
import { beginSession, getSession, resolveScope } from "../src/session";
import { tempDb } from "./helpers";

function git(cwd: string, ...args: string[]) {
  const proc = Bun.spawnSync(
    ["git", "-c", "user.email=t@example.com", "-c", "user.name=T", "-c", "protocol.file.allow=always", ...args],
    { cwd, stdout: "pipe", stderr: "pipe" },
  );
  if (proc.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${proc.stderr.toString()}`);
  return proc.stdout.toString().trim();
}

/** A repository with one commit, so worktrees and submodules can be made from it. */
function repo(path: string): string {
  mkdirSync(path, { recursive: true });
  git(path, "init", "-q");
  writeFileSync(join(path, "README"), "x\n");
  git(path, "add", "README");
  git(path, "commit", "-qm", "init");
  return realpathSync(path);
}

describe("which project a request is filed under", () => {
  let root: string;
  let previousHome: string | undefined;

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), "office-scope-")));
    previousHome = process.env.HOME;
  });

  afterEach(() => {
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
    rmSync(root, { recursive: true, force: true });
  });

  test("the folder beats a project the session remembers, and says so", () => {
    const db = tempDb();
    const beta = repo(join(root, "beta"));
    beginSession(db, { project: "/p/alpha", author: "codex-1" });
    const scope = resolveScope(db, { author: "codex-1", cwdProject: beta });
    expect(scope.project).toBe(beta);
    expect(scope.project_source).toBe("folder");
    expect(scope.scope_note).toContain(`filed under ${beta} (this folder)`);
    expect(scope.scope_note).toContain("began on /p/alpha");
    expect(scope.active_since).toBeNull();
  });

  test("an unnamed caller in a repo gets that repo, not the shared unnamed slot", () => {
    const db = tempDb();
    const beta = repo(join(root, "beta"));
    beginSession(db, { project: "/p/alpha" });
    const scope = resolveScope(db, { cwdProject: beta });
    expect(scope.project).toBe(beta);
    expect(scope.project_source).toBe("folder");
  });

  test("this call's --project still wins over the folder, and the difference is said", () => {
    const db = tempDb();
    const beta = repo(join(root, "beta"));
    beginSession(db, { project: "/p/alpha", author: "codex-1" });
    const scope = resolveScope(db, { author: "codex-1", project: "/p/gamma", cwdProject: beta });
    expect(scope.project).toBe("/p/gamma");
    expect(scope.project_source).toBe("declared");
    expect(scope.scope_note).toContain(`this folder is ${beta}`);
  });

  test("a named project that is the folder's own says nothing", () => {
    const db = tempDb();
    const beta = repo(join(root, "beta"));
    const scope = resolveScope(db, { author: "codex-1", project: beta, cwdProject: beta });
    expect(scope.scope_note).toBeNull();
  });

  test("a nameless begin in a repo leaves the shared unnamed slot alone", () => {
    const db = tempDb();
    const beta = repo(join(root, "beta"));
    beginSession(db, { project: "/p/alpha" });
    beginSession(db, { cwdProject: beta });
    expect(getSession(db, null)?.project).toBe("/p/alpha");
  });

  test("a named begin remembers its folder; one with no folder keeps what it had", () => {
    const db = tempDb();
    const beta = repo(join(root, "beta"));
    beginSession(db, { author: "claude-2", cwdProject: beta });
    expect(getSession(db, "claude-2")?.project).toBe(beta);
    beginSession(db, { author: "claude-2", cwdProject: null });
    expect(getSession(db, "claude-2")?.project).toBe(beta);
    const fromOutside = resolveScope(db, { author: "claude-2" });
    expect(fromOutside.project).toBe(beta);
    expect(fromOutside.project_source).toBe("active");
  });

  test("a subfolder or a symlink names the same project as the repository", () => {
    const alpha = repo(join(root, "alpha"));
    mkdirSync(join(alpha, "src", "deep"), { recursive: true });
    symlinkSync(alpha, join(root, "alpha-link"));
    expect(normalizeProject(join(alpha, "src", "deep"))).toBe(alpha);
    expect(normalizeProject(join(root, "alpha-link"))).toBe(alpha);
    expect(normalizeProject(join(root, "alpha-link", "src"))).toBe(alpha);
    expect(normalizeProject("src")).toBe("src");
  });

  test("an explicit path to the office checkout is the office, though the folder alone is not", () => {
    const office = realpathSync(ROOT);
    expect(normalizeProject(join(ROOT, "src"))).toBe(office);
    expect(detectCwdProject(ROOT)).toBeNull();
  });

  test("a git-tracked home folder is never a project", () => {
    const home = join(root, "home");
    mkdirSync(join(home, "notes"), { recursive: true });
    git(home, "init", "-q");
    process.env.HOME = home;
    expect(detectCwdProject(join(home, "notes"))).toBeNull();
    expect(normalizeProject(join(home, "notes"))).toBe(join(home, "notes"));
  });

  test("bare-repository worktrees share one project", () => {
    const origin = repo(join(root, "origin"));
    git(root, "clone", "-q", "--bare", origin, "proj.git");
    const bare = join(root, "proj.git");
    git(bare, "worktree", "add", "-q", join(root, "wt-main"), "HEAD");
    git(bare, "worktree", "add", "-q", "-b", "feat", join(root, "wt-feat"));
    expect(detectCwdProject(join(root, "wt-main"))).toBe(bare);
    expect(detectCwdProject(join(root, "wt-feat"))).toBe(bare);
  });

  test("a --separate-git-dir checkout and its worktree share one project", () => {
    const work = join(root, "sep-work");
    mkdirSync(work);
    git(root, "init", "-q", `--separate-git-dir=${join(root, "sep.gd")}`, work);
    writeFileSync(join(work, "README"), "x\n");
    git(work, "add", "README");
    git(work, "commit", "-qm", "init");
    git(work, "worktree", "add", "-q", "-b", "feat", join(root, "sep-wt"));
    const key = detectCwdProject(work);
    expect(key).toBe(join(root, "sep.gd"));
    expect(detectCwdProject(join(root, "sep-wt"))).toBe(key);
  });

  test("a submodule is its own project, at its own folder", () => {
    const lib = repo(join(root, "lib"));
    const sup = repo(join(root, "super"));
    git(sup, "submodule", "add", "-q", lib, "sub");
    expect(detectCwdProject(join(sup, "sub"))).toBe(join(sup, "sub"));
    expect(detectCwdProject(sup)).toBe(sup);
  });

  test("one request asks git about a project once", () => {
    const alpha = repo(join(root, "alpha"));
    withProjectMemo(() => {
      normalizeProject(alpha);
      const after = gitCallCount();
      normalizeProject(alpha);
      normalizeProject(`${alpha}/`);
      expect(gitCallCount()).toBe(after);
    });
    const before = gitCallCount();
    normalizeProject(alpha);
    expect(gitCallCount()).toBeGreaterThan(before);
  });
  test("a copied or moved repository is its own project, not the original", () => {
    const skills = join(root, "skills");
    mkdirSync(skills);
    const api = repo(join(root, "api"));
    initProject(api, { skillsPath: skills });
    cpSync(api, join(root, "api-copy"), { recursive: true, verbatimSymlinks: true });
    expect(detectCwdProject(join(root, "api-copy"))).toBe(join(root, "api-copy"));
    renameSync(api, join(root, "api2"));
    expect(detectCwdProject(join(root, "api2"))).toBe(join(root, "api2"));
    mkdirSync(join(root, "api2", "src"));
    expect(normalizeProject(join(root, "api2", "src"))).toBe(join(root, "api2"));
  });

  test("a submodule in a worktree of its superproject is the same project as in the main checkout", () => {
    const lib = repo(join(root, "lib"));
    const sup = repo(join(root, "super"));
    git(sup, "submodule", "add", "-q", lib, "sub");
    git(sup, "commit", "-qm", "sub");
    const wt = join(root, "wt");
    git(sup, "worktree", "add", "-q", "-b", "feat", wt);
    git(wt, "submodule", "update", "--init", "-q");
    expect(detectCwdProject(join(wt, "sub"))).toBe(join(sup, "sub"));
    expect(detectCwdProject(join(sup, "sub"))).toBe(join(sup, "sub"));
  });

  test("worktrees of a bare superproject agree on their submodule's project", () => {
    const lib = repo(join(root, "lib"));
    const origin = repo(join(root, "origin"));
    git(origin, "submodule", "add", "-q", lib, "sub");
    git(origin, "commit", "-qm", "sub");
    git(root, "clone", "-q", "--bare", origin, "proj.git");
    const bare = join(root, "proj.git");
    for (const name of ["wt-a", "wt-b"]) {
      git(bare, "worktree", "add", "-q", "-b", name, join(root, name));
      git(join(root, name), "submodule", "update", "--init", "-q");
    }
    const key = detectCwdProject(join(root, "wt-a", "sub"));
    expect(key).toBe(join(bare, "sub"));
    expect(detectCwdProject(join(root, "wt-b", "sub"))).toBe(key);
  });

  test("two submodules whose paths differ only by a 'modules' folder stay two projects", () => {
    const one = repo(join(root, "one"));
    const two = repo(join(root, "two"));
    const origin = repo(join(root, "origin"));
    git(origin, "submodule", "add", "-q", one, "foo/modules/bar");
    git(origin, "submodule", "add", "-q", two, "foo/bar");
    git(origin, "commit", "-qm", "subs");
    git(root, "clone", "-q", "--bare", origin, "proj.git");
    const wt = join(root, "wt");
    git(join(root, "proj.git"), "worktree", "add", "-q", "-b", "w", wt);
    git(wt, "submodule", "update", "--init", "-q");
    const a = detectCwdProject(join(wt, "foo", "modules", "bar"));
    const b = detectCwdProject(join(wt, "foo", "bar"));
    expect(a).not.toBeNull();
    expect(a).not.toBe(b);
  });

  test("a nested submodule checked out only in worktrees keeps its key when the main copy catches up", () => {
    const inner = repo(join(root, "inner"));
    const mid = repo(join(root, "mid"));
    git(mid, "submodule", "add", "-q", inner, "inner");
    git(mid, "commit", "-qm", "inner");
    const sup = repo(join(root, "super"));
    git(sup, "submodule", "add", "-q", mid, "mid");
    git(sup, "commit", "-qm", "mid");
    const clone = join(root, "clone");
    git(root, "clone", "-q", sup, clone);
    const wt = join(root, "wt");
    git(clone, "worktree", "add", "-q", "-b", "w", wt);
    git(wt, "submodule", "update", "--init", "--recursive", "-q");
    const before = detectCwdProject(join(wt, "mid", "inner"));
    expect(before).toBe(join(realpathSync(clone), "mid", "inner"));
    git(clone, "submodule", "update", "--init", "--recursive", "-q");
    expect(detectCwdProject(join(wt, "mid", "inner"))).toBe(before);
    expect(detectCwdProject(join(clone, "mid", "inner"))).toBe(before);
  });

  test("a home folder whose git folder lives elsewhere is not a project either", () => {
    const home = join(root, "home");
    mkdirSync(join(home, "loose"), { recursive: true });
    git(root, "init", "-q", `--separate-git-dir=${join(home, ".dotfiles")}`, home);
    const proc = Bun.spawnSync(
      [
        process.execPath,
        "-e",
        `import { detectCwdProject, normalizeProject } from ${JSON.stringify(join(ROOT, "src", "scope.ts"))};
         console.log(detectCwdProject(${JSON.stringify(join(home, "loose"))}), normalizeProject(${JSON.stringify(join(home, "loose"))}));`,
      ],
      { env: { ...process.env, HOME: home }, stdout: "pipe", stderr: "pipe" },
    );
    expect(proc.stdout.toString().trim()).toBe(`null ${join(home, "loose")}`);
  });

  test("a project's shown name is its folder, not git's", () => {
    expect(displayName("/p/proj/.bare")).toBe("proj");
    expect(displayName("/p/proj.git")).toBe("proj");
    expect(displayName("/p/api")).toBe("api");
    expect(displayName("fencing-team-draft-game")).toBe("fencing-team-draft-game");
  });

  test("with no git installed, a folder is simply not a project", () => {
    const alpha = repo(join(root, "alpha"));
    const proc = Bun.spawnSync(
      [
        process.execPath,
        "-e",
        `import { detectCwdProject } from ${JSON.stringify(join(ROOT, "src", "scope.ts"))};
         console.log(detectCwdProject(${JSON.stringify(alpha)}));`,
      ],
      { env: { ...process.env, PATH: "/nonexistent" }, stdout: "pipe", stderr: "pipe" },
    );
    expect(proc.stdout.toString().trim()).toBe("null");
  });

  test("after the main checkout deinits a submodule, its worktree copy keeps the key", () => {
    const lib = repo(join(root, "lib"));
    const sup = repo(join(root, "super"));
    git(sup, "submodule", "add", "-q", lib, "sub");
    git(sup, "commit", "-qm", "sub");
    const wt = join(root, "wt");
    git(sup, "worktree", "add", "-q", "-b", "w", wt);
    git(wt, "submodule", "update", "--init", "-q");
    git(sup, "submodule", "deinit", "-q", "-f", "sub");
    expect(detectCwdProject(join(wt, "sub"))).toBe(join(sup, "sub"));
  });

  test("GIT_DIR and friends in the shell do not move the folder to another repository", () => {
    const alpha = repo(join(root, "alpha"));
    const other = repo(join(root, "other"));
    // The agent's shell is a separate process with its own environment.
    const proc = Bun.spawnSync(
      [
        process.execPath,
        "-e",
        `import { detectCwdProject } from ${JSON.stringify(join(ROOT, "src", "scope.ts"))};
         console.log(detectCwdProject(${JSON.stringify(alpha)}));`,
      ],
      {
        env: { ...process.env, GIT_DIR: join(other, ".git"), GIT_WORK_TREE: other },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    expect(proc.stderr.toString()).toBe("");
    expect(proc.stdout.toString().trim()).toBe(alpha);
  });
});
