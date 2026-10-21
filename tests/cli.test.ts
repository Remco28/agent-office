import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

  async function cli(args: string[], overrides: Record<string, string | undefined> = {}) {
    const proc = Bun.spawn([process.execPath, join(ROOT, "src/index.ts"), ...args], {
      env: { ...env, ...overrides }, stdout: "pipe", stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited,
    ]);
    if (code !== 0) throw new Error(stderr);
    return args.includes("--text") ? stdout : JSON.parse(stdout);
  }

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
    await cli(["remember", "alpha notes", "--by", "test-1111"]);
    await cli(["remember", "beta notes", "--by", "test-2222"]);
    await cli(["work", "open", "alpha task", "--by", "test-1111"]);
    await cli(["work", "open", "beta task", "--by", "test-2222"]);
  });

  afterEach(() => {
    office?.stop();
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    rmSync(dir, { recursive: true, force: true });
  });

  test("named reads inherit their own project; explicit overrides do not replace it", async () => {
    for (const args of [["context"], ["search", "notes"], ["work"]]) {
      const mine = await cli([...args, "--by", "test-1111"]);
      expect(mine.project).toBe("/p/alpha");
      expect(mine.project_source).toBe("active");
      expect(mine.hits?.map((h: any) => h.content) ?? mine.work.map((w: any) => w.title))
        .toEqual([args[0] === "work" ? "alpha task" : "alpha notes"]);
      const override = await cli([...args, "--by", "test-1111", "--project", "/p/beta"]);
      expect(override.project).toBe("/p/beta");
      expect(override.project_source).toBe("declared");
      expect((await cli([...args, "--by", "test-1111"])).project).toBe("/p/alpha");
    }
  });

  test("reads honor caller environment and flag precedence", async () => {
    for (const args of [["context"], ["search", "notes"], ["work"]]) {
      expect((await cli(args, { OFFICE_AUTHOR: "test-2222" })).project).toBe("/p/beta");
      for (const key of ["OFFICE_PROJECT", "OFFICE_SOURCE"]) {
        const vars = { OFFICE_AUTHOR: "test-1111", [key]: "/p/beta" };
        expect((await cli(args, vars)).project).toBe("/p/beta");
        expect((await cli([...args, "--project", "/p/alpha"], vars)).project).toBe("/p/alpha");
      }
      expect((await cli([...args, "--by", "test-1111"], { OFFICE_AUTHOR: "test-2222" })).project).toBe("/p/alpha");
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
