import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { buildOfficeSection, initProject } from "../src/init";
import { ROOT } from "../src/paths";
import { detectCwdProject, normalizeProject, resolveGitProject } from "../src/scope";
import { serve, type Office } from "../src/server";
import { groupedEmbedder } from "./helpers";

describe("office init and git/worktree project detection", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), "office-init-"));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test("the office's own AGENTS.md carries init's section word for word", () => {
    // the agents building the office read exactly what every project gets
    const agentsMd = readFileSync(join(ROOT, "AGENTS.md"), "utf8");
    expect(agentsMd).toContain(buildOfficeSection("agent-office"));
  });

  test("initializes a non-git folder with local git, skill links, and AGENTS.md, then reports already set up on repeat", () => {
    const projectDir = join(tempRoot, "my-local-app");
    const skillsDir = join(tempRoot, "skills");
    mkdirSync(skillsDir, { recursive: true });

    const first = initProject(projectDir, { skillsPath: skillsDir });
    expect(first.ok).toBe(true);
    expect(first.project).toBe(projectDir);
    expect(first.name).toBe("my-local-app");
    expect(first.git_initialized).toBe(true);
    expect(first.already_initialized).toBe(false);
    expect(first.message).toContain("Agent Office · set up my-local-app");

    // Verify local git repository and config link
    expect(existsSync(join(projectDir, ".git"))).toBe(true);
    const gitInfo = resolveGitProject(projectDir);
    expect(gitInfo?.repoRoot).toBe(projectDir);
    expect(readFileSync(join(projectDir, ".git", "config"), "utf8")).not.toContain("office");

    // Verify skill symlinks and CLAUDE.md -> AGENTS.md
    expect(lstatSync(join(projectDir, ".claude", "skills")).isSymbolicLink()).toBe(true);
    expect(lstatSync(join(projectDir, ".agents", "skills")).isSymbolicLink()).toBe(true);
    expect(lstatSync(join(projectDir, "CLAUDE.md")).isSymbolicLink()).toBe(true);

    // Verify AGENTS.md content
    const agentsMd = readFileSync(join(projectDir, "AGENTS.md"), "utf8");
    expect(agentsMd).toContain("office begin --by <your-tool>");
    expect(agentsMd).toContain("Working on my-local-app within Agent Office");

    // Second run reports already set up and makes no changes
    const second = initProject(projectDir, { skillsPath: skillsDir });
    expect(second.already_initialized).toBe(true);
    expect(second.git_initialized).toBe(false);
    expect(second.actions).toEqual([]);
    expect(second.message).toContain("is already set up and linked");
  });

  test("preserves existing AGENTS.md content and appends the Agent Office section once", () => {
    const projectDir = join(tempRoot, "existing-notes");
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(join(projectDir, "AGENTS.md"), "# Custom Project Rules\n\nKeep tests green.\n", "utf8");

    const first = initProject(projectDir);
    expect(first.already_initialized).toBe(false);
    const updated = readFileSync(join(projectDir, "AGENTS.md"), "utf8");
    expect(updated).toContain("# Custom Project Rules");
    expect(updated).toContain("Keep tests green.");
    expect(updated).toContain("## Agent Office");

    const second = initProject(projectDir);
    expect(second.already_initialized).toBe(true);
    expect(readFileSync(join(projectDir, "AGENTS.md"), "utf8")).toBe(updated);
  });

  test("refuses to initialize $HOME", () => {
    expect(() => initProject(homedir())).toThrow(/refusing to initialize \$HOME/);
  });

  test("resolves git worktrees (such as T3 Code worktrees) back to the main project repository", async () => {
    const mainRepo = join(tempRoot, " widgets-app".trim());
    initProject(mainRepo);

    // Create an initial commit so we can add a git worktree
    Bun.spawnSync(["git", "-C", mainRepo, "config", "user.email", "test@example.com"]);
    Bun.spawnSync(["git", "-C", mainRepo, "config", "user.name", "Test"]);
    Bun.spawnSync(["git", "-C", mainRepo, "add", "AGENTS.md"]);
    Bun.spawnSync(["git", "-C", mainRepo, "commit", "-m", "initial"]);

    const worktreeDir = join(tempRoot, "t3-worktree-feature-1");
    const wt = Bun.spawnSync(["git", "-C", mainRepo, "worktree", "add", "-b", "feat-1", worktreeDir], {
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(wt.exitCode).toBe(0);

    // Both detectCwdProject and normalizeProject resolve the worktree back to mainRepo
    mkdirSync(join(worktreeDir, "subdir"), { recursive: true });
    expect(detectCwdProject(worktreeDir)).toBe(mainRepo);
    expect(detectCwdProject(join(worktreeDir, "subdir"))).toBe(mainRepo);
    expect(normalizeProject(worktreeDir)).toBe(mainRepo);

    // Test end-to-end CLI running inside the worktree without --project
    const officeHome = join(tempRoot, "office-data");
    mkdirSync(join(officeHome, "skills"), { recursive: true });
    const prevHome = process.env.OFFICE_HOME;
    const prevDb = process.env.OFFICE_DB;
    const prevSkills = process.env.OFFICE_SKILLS;
    process.env.OFFICE_HOME = officeHome;
    process.env.OFFICE_DB = join(officeHome, "memory.db");
    process.env.OFFICE_SKILLS = join(officeHome, "skills");

    let office: Office | null = null;
    try {
      office = serve({ embedder: groupedEmbedder([["auth", "login"]]), port: 0 });
      const env = {
        ...process.env,
        OFFICE_PORT: String(office.port),
        OFFICE_AUTHOR: undefined,
        OFFICE_PROJECT: undefined,
        OFFICE_SOURCE: undefined,
      };

      const runInWorktree = async (args: string[]) => {
        const proc = Bun.spawn([process.execPath, join(ROOT, "src/index.ts"), ...args], {
          cwd: worktreeDir,
          env,
          stdout: "pipe",
          stderr: "pipe",
        });
        const [stdout, stderr, code] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
          proc.exited,
        ]);
        if (code !== 0) throw new Error(stderr);
        return { json: JSON.parse(stdout), stderr };
      };

      // 1. Begin inside the worktree with no --project flag
      const begun = await runInWorktree(["begin", "--by", "claude"]);
      expect(begun.json.project).toBe(mainRepo);
      expect(begun.json.project_source).toBe("folder");
      expect(begun.json.banner).toContain(`Agent Office · working on widgets-app (${mainRepo}) as claude-`);
      expect(begun.stderr).toContain(`Agent Office · working on widgets-app (${mainRepo}) as claude-`);

      const agentId = begun.json.author;

      // 2. Remember a fact from inside the worktree
      const remembered = await runInWorktree(["remember", "login uses passkeys", "--by", agentId]);
      expect(remembered.json.memory.project).toBe(mainRepo);

      // 3. Query context from inside the worktree without --by or --project
      const ctx = await runInWorktree(["context", "auth"]);
      expect(ctx.json.project).toBe(mainRepo);
      expect(ctx.json.hits.map((h: any) => h.content)).toEqual(["login uses passkeys"]);
    } finally {
      office?.stop();
      if (prevHome === undefined) delete process.env.OFFICE_HOME;
      else process.env.OFFICE_HOME = prevHome;
      if (prevDb === undefined) delete process.env.OFFICE_DB;
      else process.env.OFFICE_DB = prevDb;
      if (prevSkills === undefined) delete process.env.OFFICE_SKILLS;
      else process.env.OFFICE_SKILLS = prevSkills;
    }
  });
});
