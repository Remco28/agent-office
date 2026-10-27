import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { serve, type Office } from "../src/server";
import { groupedEmbedder } from "./helpers";
import { ROOT } from "../src/paths";

describe("CLI and daemon integration", () => {
  let office: Office;
  let dir: string;
  let previous: Record<string, string | undefined>;
  let env: Record<string, string | undefined>;
  const keys = ["OFFICE_HOME", "OFFICE_DB", "OFFICE_SKILLS"];

  async function cli(args: string[], overrides: Record<string, string | undefined> = {}, cwd?: string) {
    const proc = Bun.spawn([process.execPath, join(ROOT, "src/index.ts"), ...args], {
      // Run from a folder that is not a repository, so the results never
      // depend on where the suite itself was started.
      cwd: cwd ?? dir, env: { ...env, ...overrides }, stdout: "pipe", stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited,
    ]);
    if (code !== 0) throw new Error(stderr);
    lastStderr = stderr;
    return args.includes("--text") ? stdout : JSON.parse(stdout);
  }
  let lastStderr = "";

  function gitRepo(name: string): string {
    const path = join(dir, name);
    mkdirSync(path);
    Bun.spawnSync(["git", "init", "-q", path]);
    return realpathSync(path);
  }

  test("outside a repository, a call inherits nothing from the begin before it", async () => {
    const begun = await cli(["begin", "--project", "/p/shared", "--by", "test-3333"]);
    expect(lastStderr).toContain("not a git repository");
    expect(begun.project).toBe("/p/shared");
    expect((await cli(["context", "--by", "test-3333"])).project).toBeNull();
    const repo = gitRepo("repo-x");
    const inRepo = await cli(["begin"], {}, repo);
    expect(inRepo.project).toBe(repo);
    expect(inRepo.project_source).toBe("folder");
  });

  test("the removed office manager role is refused, not silently ignored", async () => {
    await expect(cli(["begin", "--by", "test-4444", "--role", "manager"])).rejects.toThrow(/role was removed/);
    await expect(cli(["begin", "--by", "test-4444"], { OFFICE_ROLE: "manager" })).rejects.toThrow(/role was removed/);
  });

  test("a write from another repository is filed there and says so on stderr", async () => {
    const repo = gitRepo("repo-y");
    const written = await cli(["remember", "y fact", "--by", "test-1111"], {}, repo);
    expect(written.memory.project).toBe(repo);
    expect(written.project_source).toBe("folder");
    expect(lastStderr).toContain("this session began on /p/alpha");
    expect(lastStderr).toContain("start a new agent there");
  });

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "office-cli-"));
    previous = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    process.env.OFFICE_HOME = dir;
    process.env.OFFICE_DB = join(dir, "memory.db");
    process.env.OFFICE_SKILLS = join(dir, "skills");
    mkdirSync(join(dir, "skills", "desktop-polish"), { recursive: true });
    writeFileSync(join(dir, "skills", "desktop-polish", "SKILL.md"),
      "---\nname: desktop-polish\ndescription: Make desktop apps polished.\n---\n");
    office = serve({ embedder: groupedEmbedder([["polished", "beautiful"]]), port: 0 });
    env = { ...process.env, OFFICE_PORT: String(office.port), OFFICE_AUTHOR: undefined,
      OFFICE_PROJECT: undefined, OFFICE_SOURCE: undefined, OFFICE_ROLE: undefined };
    await cli(["begin", "--project", "/p/alpha", "--by", "test-1111"]);
    await cli(["begin", "--project", "/p/beta", "--by", "test-2222"]);
    await cli(["remember", "alpha notes", "--project", "/p/alpha", "--by", "test-1111"]);
    await cli(["remember", "beta notes", "--project", "/p/beta", "--by", "test-2222"]);
    await cli(["work", "open", "alpha task", "--project", "/p/alpha", "--by", "test-1111"]);
    await cli(["work", "open", "beta task", "--project", "/p/beta", "--by", "test-2222"]);
  });

  afterEach(() => {
    office?.stop();
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    rmSync(dir, { recursive: true, force: true });
  });

  test("a read's project is its --project or OFFICE_PROJECT, never its session's", async () => {
    for (const args of [["context"], ["search", "notes"], ["work"]]) {
      // test-1111 began on /p/alpha, but a read that names no project, outside
      // any repository, has none
      const bare = await cli([...args, "--by", "test-1111"]);
      expect(bare.project).toBeNull();
      expect(bare.project_source).toBe("none");
      const mine = await cli([...args, "--by", "test-1111", "--project", "/p/alpha"]);
      expect(mine.project).toBe("/p/alpha");
      expect(mine.project_source).toBe("declared");
      expect(mine.hits?.map((h: any) => h.content) ?? mine.work.map((w: any) => w.title))
        .toEqual([args[0] === "work" ? "alpha task" : "alpha notes"]);
      for (const key of ["OFFICE_PROJECT", "OFFICE_SOURCE"]) {
        const vars = { OFFICE_AUTHOR: "test-1111", [key]: "/p/beta" };
        expect((await cli(args, vars)).project).toBe("/p/beta");
        expect((await cli([...args, "--project", "/p/alpha"], vars)).project).toBe("/p/alpha");
      }
    }
  });

  test("anonymous and unknown callers cannot borrow named sessions", async () => {
    for (const args of [["context"], ["search", "notes"], ["work"]]) {
      for (const identity of [[], ["--by", "unknown-3333"]]) {
        const result = await cli([...args, ...identity]);
        expect(result.project).toBeNull();
        expect(result.hits ?? result.work).toEqual([]);
      }
    }
    expect((await cli(["work", "open", "unclaimed"])).unclaimed).toBe(true);
    // The explicit whole-store views retain their intended behavior.
    expect((await cli(["work", "log", "--by", "test-1111"])).work).toHaveLength(3);
    expect((await cli(["list", "--by", "test-1111"])).memories).toHaveLength(2);
  });

  test("context and search discover skills across projects and in text output", async () => {
    for (const cmd of ["context", "search"]) {
      const result = await cli([cmd, "beautiful", "--by", "test-1111"]);
      expect(result.skill_hits).toHaveLength(1);
      expect(result.skill_hits[0]).toMatchObject({ kind: "skill", name: "desktop-polish", via: "vector" });
      expect(result.skill_hits[0].path).toBe(join(dir, "skills/desktop-polish/SKILL.md"));
      expect(result.hits).toEqual([]);
      expect(result.note).toBeNull();
      const text = await cli([cmd, "beautiful", "--text"]);
      expect(text).toContain("desktop-polish");
      expect(text).toContain("SKILL.md");
      expect(text).not.toContain("(none)");
    }
    expect((await cli(["context", "--by", "test-1111"])).skill_hits).toEqual([]);
    const health = await (await fetch(`http://127.0.0.1:${office.port}/health`)).json();
    expect(health.memories).toBe(2); // Skill discovery never persists memory rows.
  });
});
