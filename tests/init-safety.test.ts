import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initProject } from "../src/init";
import { ROOT } from "../src/paths";

function git(cwd: string, ...args: string[]) {
  const proc = Bun.spawnSync(
    ["git", "-c", "user.email=t@example.com", "-c", "user.name=T", ...args],
    { cwd, stdout: "pipe", stderr: "pipe" },
  );
  if (proc.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${proc.stderr.toString()}`);
  return proc.stdout.toString();
}

function repo(path: string): string {
  mkdirSync(path, { recursive: true });
  git(path, "init", "-q");
  writeFileSync(join(path, "README"), "x\n");
  git(path, "add", "README");
  git(path, "commit", "-qm", "init");
  return realpathSync(path);
}

function untracked(path: string): string[] {
  return git(path, "status", "--porcelain", "--untracked-files=all")
    .split("\n")
    .filter((line) => line.startsWith("??"))
    .map((line) => line.slice(3));
}

describe("office init leaves the user's files alone", () => {
  let root: string;
  let skills: string;
  let previousHome: string | undefined;

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), "office-init-safety-")));
    skills = join(root, "office-skills");
    mkdirSync(skills);
    previousHome = process.env.HOME;
    process.env.HOME = join(root, "home");
    mkdirSync(process.env.HOME);
  });

  afterEach(() => {
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
    rmSync(root, { recursive: true, force: true });
  });

  test("a folder inside another repository is refused, and nothing is written", () => {
    const outer = repo(join(root, "outer"));
    const inner = join(outer, "newapp");
    expect(() => initProject(inner, { skillsPath: skills })).toThrow(
      `is inside the git repository ${outer}. To set up that repository, run \`office init ${outer}\``,
    );
    expect(existsSync(inner)).toBe(false);
    expect(existsSync(join(outer, "AGENTS.md"))).toBe(false);
  });

  test("a git-tracked home folder is never set up", () => {
    const home = process.env.HOME!;
    git(home, "init", "-q");
    expect(() => initProject(join(home, "newapp"), { skillsPath: skills })).toThrow(
      /inside a git repository at your home folder/,
    );
    expect(existsSync(join(home, "AGENTS.md"))).toBe(false);
    expect(existsSync(join(home, "CLAUDE.md"))).toBe(false);
    expect(existsSync(join(home, ".claude"))).toBe(false);
  });

  test("from a worktree's subfolder, the refusal names that worktree, not the main checkout", () => {
    const main = repo(join(root, "main"));
    const wt = join(root, "wt");
    git(main, "worktree", "add", "-q", "-b", "feat", wt);
    mkdirSync(join(wt, "src"));
    expect(() => initProject(join(wt, "src"), { skillsPath: skills })).toThrow(
      `run \`office init ${realpathSync(wt)}\``,
    );
  });

  test("a subfolder of the office checkout is refused", () => {
    expect(() => initProject(join(ROOT, "src"), { skillsPath: skills })).toThrow(
      /inside the agent-office checkout/,
    );
  });

  test("inside a bare repository or a .git folder, init refuses instead of nesting a repo", () => {
    git(root, "init", "-q", "--bare", "proj.git");
    const bare = join(root, "proj.git");
    expect(() => initProject(bare, { skillsPath: skills })).toThrow(/bare repository/);
    expect(() => initProject(join(bare, "newthing"), { skillsPath: skills })).toThrow(/bare repository/);
    expect(existsSync(join(bare, ".git"))).toBe(false);
    expect(existsSync(join(bare, "newthing"))).toBe(false);
    const normal = repo(join(root, "normal"));
    expect(() => initProject(join(normal, ".git"), { skillsPath: skills })).toThrow(/data folder/);
  });

  test("the user's own CLAUDE.md files and skills folder stay visible to git", () => {
    const app = repo(join(root, "app"));
    writeFileSync(join(app, "CLAUDE.md"), "my own notes\n");
    mkdirSync(join(app, "pkg"));
    writeFileSync(join(app, "pkg", "CLAUDE.md"), "package notes\n");
    mkdirSync(join(app, ".claude", "skills", "mine"), { recursive: true });
    writeFileSync(join(app, ".claude", "skills", "mine", "SKILL.md"), "x\n");
    initProject(app, { skillsPath: skills });
    const seen = untracked(app);
    expect(seen).toContain("CLAUDE.md");
    expect(seen).toContain("pkg/CLAUDE.md");
    expect(seen).toContain(".claude/skills/mine/SKILL.md");
    const exclude = join(app, ".git", "info", "exclude");
    const text = existsSync(exclude) ? readFileSync(exclude, "utf8") : "";
    expect(text).not.toContain("CLAUDE.md");
    expect(text).not.toContain("skills");
    // A CLAUDE.md added later, anywhere, is visible too.
    mkdirSync(join(app, "later"));
    writeFileSync(join(app, "later", "CLAUDE.md"), "x\n");
    expect(untracked(app)).toContain("later/CLAUDE.md");
  });

  test("an AGENTS.md that links to a shared file is not written through", () => {
    const shared = join(root, "shared-AGENTS.md");
    writeFileSync(shared, "# Team rules\n");
    const app = repo(join(root, "app"));
    symlinkSync(shared, join(app, "AGENTS.md"));
    const result = initProject(app, { skillsPath: skills });
    expect(readFileSync(shared, "utf8")).toBe("# Team rules\n");
    expect(lstatSync(join(app, "AGENTS.md")).isSymbolicLink()).toBe(true);
    expect(result.warnings.join("\n")).toContain(`AGENTS.md is a link to ${shared}`);
  });

  test("a broken AGENTS.md link does not crash init", () => {
    const app = repo(join(root, "app"));
    symlinkSync(join(root, "missing.md"), join(app, "AGENTS.md"));
    const result = initProject(app, { skillsPath: skills });
    expect(result.warnings.join("\n")).toContain("(broken)");
    expect(existsSync(join(root, "missing.md"))).toBe(false);
  });

  test("the old setup's links to the office's AGENTS.md are both left as they are", () => {
    const app = repo(join(root, "app"));
    const officeAgents = join(ROOT, "AGENTS.md");
    symlinkSync(officeAgents, join(app, "AGENTS.md"));
    symlinkSync(officeAgents, join(app, "CLAUDE.md"));
    const result = initProject(app, { skillsPath: skills });
    expect(readlinkSync(join(app, "AGENTS.md"))).toBe(officeAgents);
    expect(readlinkSync(join(app, "CLAUDE.md"))).toBe(officeAgents);
    expect(result.warnings.join("\n")).toContain("the office's own AGENTS.md");
  });

  test("a .claude that links outside the repository gets nothing created in it", () => {
    const outside = join(root, "shared-claude");
    mkdirSync(outside);
    const app = repo(join(root, "app"));
    symlinkSync(outside, join(app, ".claude"));
    const result = initProject(app, { skillsPath: skills });
    expect(existsSync(join(outside, "skills"))).toBe(false);
    expect(result.warnings.join("\n")).toContain(".claude is a link to");
    expect(lstatSync(join(app, ".agents", "skills")).isSymbolicLink()).toBe(true);
  });

  test("the generated AGENTS.md names no folder path and states the one-repository rule", () => {
    const app = join(root, "fresh");
    initProject(app, { skillsPath: skills });
    const text = readFileSync(join(app, "AGENTS.md"), "utf8");
    expect(text).not.toContain(root);
    expect(text).not.toContain(realpathSync(ROOT));
    expect(text).toContain("One agent, one repository");
  });

  test("an existing CLAUDE.md without the startup steps is left alone and named", () => {
    const app = repo(join(root, "app"));
    writeFileSync(join(app, "CLAUDE.md"), "# notes\n");
    const result = initProject(app, { skillsPath: skills });
    expect(readFileSync(join(app, "CLAUDE.md"), "utf8")).toBe("# notes\n");
    expect(result.warnings.join("\n")).toContain("add a line `@AGENTS.md`");

    const other = repo(join(root, "other"));
    writeFileSync(join(other, "CLAUDE.md"), "# notes\n@AGENTS.md\n");
    expect(initProject(other, { skillsPath: skills }).warnings).toEqual([]);

    const fresh = join(root, "fresh");
    expect(initProject(fresh, { skillsPath: skills }).warnings).toEqual([]);
    expect(initProject(fresh, { skillsPath: skills }).already_initialized).toBe(true);
  });
  test("a .claude that links to .agents gets one skills link, and init finishes", () => {
    const app = repo(join(root, "app"));
    mkdirSync(join(app, ".agents"));
    symlinkSync(".agents", join(app, ".claude"));
    const result = initProject(app, { skillsPath: skills });
    expect(lstatSync(join(app, ".agents", "skills")).isSymbolicLink()).toBe(true);
    expect(existsSync(join(app, "AGENTS.md"))).toBe(true);
    expect(lstatSync(join(app, "CLAUDE.md")).isSymbolicLink()).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  test("a .claude linking to a missing .agents is called broken, not outside", () => {
    const app = repo(join(root, "app"));
    symlinkSync(".agents", join(app, ".claude"));
    const result = initProject(app, { skillsPath: skills });
    const text = result.warnings.join("\n");
    expect(text).toContain("(broken)");
    expect(text).not.toContain("outside");
  });

  test("a folder of projects is refused when a project is a link to a repository", () => {
    const real = repo(join(root, "code", "api"));
    const projects = join(root, "Projects");
    mkdirSync(projects);
    symlinkSync(real, join(projects, "api"));
    expect(() => initProject(projects, { skillsPath: skills })).toThrow(/holds other git repositories/);
    expect(existsSync(join(projects, ".git"))).toBe(false);
  });

  test("a hard-linked AGENTS.md is not written through", () => {
    const shared = join(root, "shared.md");
    writeFileSync(shared, "# Team\n");
    const app = repo(join(root, "app"));
    linkSync(shared, join(app, "AGENTS.md"));
    const result = initProject(app, { skillsPath: skills });
    expect(readFileSync(shared, "utf8")).toBe("# Team\n");
    expect(result.warnings.join("\n")).toContain("AGENTS.md");
  });

  test("AGENTS.md hard-linked to CLAUDE.md is set up like a plain file", () => {
    const app = repo(join(root, "app"));
    writeFileSync(join(app, "AGENTS.md"), "# App\n");
    linkSync(join(app, "AGENTS.md"), join(app, "CLAUDE.md"));
    const result = initProject(app, { skillsPath: skills });
    expect(readFileSync(join(app, "CLAUDE.md"), "utf8")).toContain("<!-- agent-office -->");
    expect(result.warnings).toEqual([]);
  });

  test("a bare-clone layout is named after its folder, not .bare", () => {
    const origin = repo(join(root, "origin"));
    const proj = join(root, "proj");
    mkdirSync(proj);
    git(proj, "clone", "-q", "--bare", origin, ".bare");
    writeFileSync(join(proj, ".git"), "gitdir: ./.bare\n");
    git(proj, "worktree", "add", "-q", join(proj, "main"), "HEAD");
    const result = initProject(join(proj, "main"), { skillsPath: skills });
    expect(result.name).toBe("proj");
    expect(readFileSync(join(proj, "main", "AGENTS.md"), "utf8")).toContain("This repository (`proj`)");
  });

  test("three inits at once all finish, with one section", async () => {
    const app = repo(join(root, "app"));
    writeFileSync(join(app, "AGENTS.md"), "# App\n");
    const script = `import { initProject } from ${JSON.stringify(join(ROOT, "src", "init.ts"))};
      initProject(${JSON.stringify(app)}, { skillsPath: ${JSON.stringify(skills)} });`;
    const procs = [0, 1, 2].map(() =>
      Bun.spawn([process.execPath, "-e", script], { stdout: "pipe", stderr: "pipe" }),
    );
    const codes = await Promise.all(procs.map((p) => p.exited));
    expect(codes).toEqual([0, 0, 0]);
    const text = readFileSync(join(app, "AGENTS.md"), "utf8");
    expect(text.split("<!-- agent-office -->").length - 1).toBeLessThanOrEqual(1);
  });

  test("a worktree of a home-folder repository is refused", () => {
    const home = process.env.HOME!;
    git(home, "init", "-q");
    writeFileSync(join(home, ".profile"), "x\n");
    git(home, "add", ".profile");
    git(home, "commit", "-qm", "dot");
    const wt = join(root, "dot-wt");
    git(home, "worktree", "add", "-q", "-b", "w", wt);
    expect(() => initProject(wt, { skillsPath: skills })).toThrow(/home folder/);
    expect(existsSync(join(wt, "AGENTS.md"))).toBe(false);
  });

  test("a .git that git cannot read is refused, and nothing is written through it", () => {
    const elsewhere = join(root, "elsewhere");
    mkdirSync(elsewhere);
    writeFileSync(join(elsewhere, "notes"), "mine\n");
    const app = join(root, "app");
    mkdirSync(app);
    symlinkSync(elsewhere, join(app, ".git"));
    expect(() => initProject(app, { skillsPath: skills })).toThrow(/\.git/);
    expect(existsSync(join(elsewhere, "HEAD"))).toBe(false);
    expect(existsSync(join(app, "AGENTS.md"))).toBe(false);
  });

  test("a git template that hides AGENTS.md is named, not passed over in silence", () => {
    const tpl = join(root, "tpl");
    mkdirSync(join(tpl, "info"), { recursive: true });
    writeFileSync(join(tpl, "info", "exclude"), "AGENTS.md\nCLAUDE.md\n");
    const app = join(root, "fresh");
    const proc = Bun.spawnSync(
      [
        process.execPath,
        "-e",
        `import { initProject } from ${JSON.stringify(join(ROOT, "src", "init.ts"))};
         console.log(JSON.stringify(initProject(${JSON.stringify(app)}, { skillsPath: ${JSON.stringify(skills)} }).warnings));`,
      ],
      { env: { ...process.env, GIT_TEMPLATE_DIR: tpl }, stdout: "pipe", stderr: "pipe" },
    );
    expect(proc.exitCode).toBe(0);
    const warnings: string[] = JSON.parse(proc.stdout.toString());
    expect(warnings.join("\n")).toContain("git ignores AGENTS.md");
    expect(warnings.join("\n")).toContain("git ignores CLAUDE.md");
  });

  test("a link into a repository's subfolder is refused like the subfolder itself", () => {
    const proj = repo(join(root, "proj"));
    mkdirSync(join(proj, "src"));
    symlinkSync(join(proj, "src"), join(root, "src-link"));
    expect(() => initProject(join(root, "src-link"), { skillsPath: skills })).toThrow(
      `is inside the git repository ${proj}`,
    );
    expect(() => initProject(join(root, "src-link", "newapp"), { skillsPath: skills })).toThrow(
      /is inside the git repository/,
    );
    expect(existsSync(join(proj, "src", ".git"))).toBe(false);
    expect(existsSync(join(proj, "src", "newapp"))).toBe(false);
  });

  test("a .git folder git cannot read is repaired, and the repair is reported", () => {
    const app = join(root, "app");
    mkdirSync(join(app, ".git"), { recursive: true });
    writeFileSync(join(app, ".git", "HEAD"), "ref: refs/heads/main\n");
    const result = initProject(app, { skillsPath: skills });
    expect(result.actions).toContain("repaired git repository");
    expect(result.already_initialized).toBe(false);
    expect(existsSync(join(app, ".git", "objects"))).toBe(true);
  });

  test("init records nothing in git's config", () => {
    const app = join(root, "fresh");
    initProject(app, { skillsPath: skills });
    expect(readFileSync(join(app, ".git", "config"), "utf8")).not.toContain("office");
  });

  test("GIT_DIR in the shell does not send init into another repository", () => {
    const other = repo(join(root, "other"));
    const before = readFileSync(join(other, ".git", "config"), "utf8");
    const app = join(root, "fresh");
    const proc = Bun.spawnSync(
      [
        process.execPath,
        "-e",
        `import { initProject } from ${JSON.stringify(join(ROOT, "src", "init.ts"))};
         initProject(${JSON.stringify(app)}, { skillsPath: ${JSON.stringify(skills)} });`,
      ],
      {
        env: { ...process.env, GIT_DIR: join(other, ".git"), GIT_WORK_TREE: other },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    expect(proc.stderr.toString()).toBe("");
    expect(existsSync(join(app, ".git"))).toBe(true);
    expect(readFileSync(join(other, ".git", "config"), "utf8")).toBe(before);
  });

  test("a folder that holds other repositories is refused, and nothing is written", () => {
    const projects = join(root, "Projects");
    repo(join(projects, "api"));
    repo(join(projects, "group", "web"));
    expect(() => initProject(projects, { skillsPath: skills })).toThrow(
      /holds other git repositories/,
    );
    expect(existsSync(join(projects, ".git"))).toBe(false);
    expect(existsSync(join(projects, "AGENTS.md"))).toBe(false);
  });

  test("a submodule of the repository does not count as a repository it holds", () => {
    const lib = repo(join(root, "lib"));
    const app = repo(join(root, "app"));
    git(app, "-c", "protocol.file.allow=always", "submodule", "add", "-q", lib, "vendor/lib");
    expect(() => initProject(app, { skillsPath: skills })).not.toThrow();
  });

  test("an AGENTS.md that only mentions the words still gets the section", () => {
    const app = repo(join(root, "app"));
    writeFileSync(join(app, "AGENTS.md"), "Run the back-office begin script first.\n");
    initProject(app, { skillsPath: skills });
    expect(readFileSync(join(app, "AGENTS.md"), "utf8")).toContain("<!-- agent-office -->");
  });

  test("appending keeps the bytes already in AGENTS.md", () => {
    const app = repo(join(root, "app"));
    const latin1 = Buffer.from([0x63, 0x61, 0x66, 0xe9, 0x0a]);
    writeFileSync(join(app, "AGENTS.md"), latin1);
    initProject(app, { skillsPath: skills });
    const after = readFileSync(join(app, "AGENTS.md"));
    expect(after.subarray(0, latin1.length).equals(latin1)).toBe(true);
  });

  test("an AGENTS.md folder gets no CLAUDE.md link pointing at it", () => {
    const app = repo(join(root, "app"));
    mkdirSync(join(app, "AGENTS.md"));
    initProject(app, { skillsPath: skills });
    expect(existsSync(join(app, "CLAUDE.md"))).toBe(false);
  });

  test("a quoted ~ means the home folder", () => {
    const result = initProject("~/newapp", { skillsPath: skills });
    expect(result.worktree).toBe(join(process.env.HOME!, "newapp"));
    expect(existsSync(join(process.cwd(), "~"))).toBe(false);
  });

  test("run in a worktree, the message names the worktree it wrote to", () => {
    const main = repo(join(root, "main"));
    const wt = join(root, "wt");
    git(main, "worktree", "add", "-q", "-b", "feat", wt);
    const result = initProject(wt, { skillsPath: skills });
    expect(result.message).toContain(realpathSync(wt));
    expect(result.warnings.join("\n")).toContain("branch");
  });

  test("a skills folder of the user's own is named, not passed over in silence", () => {
    const app = repo(join(root, "app"));
    mkdirSync(join(app, ".claude", "skills"), { recursive: true });
    const result = initProject(app, { skillsPath: skills });
    expect(result.warnings.join("\n")).toContain(".claude/skills");
  });
});
