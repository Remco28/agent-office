import { afterEach, describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { fakeEmbedder } from "../src/embed";
import { remember } from "../src/memory";
import { briefing, getActive, resolveScope, setActive } from "../src/session";
import { upsertTool } from "../src/tools";
import { openWork } from "../src/work";
import { tempDb } from "./helpers";

describe("session", () => {
  const dbs: ReturnType<typeof tempDb>[] = [];
  afterEach(() => {
    for (const db of dbs) db.close();
    dbs.length = 0;
  });

  test("the briefing gathers what a fresh session needs", async () => {
    const db = tempDb();
    dbs.push(db);
    const embedder = fakeEmbedder();
    upsertTool(db, { name: "rg", summary: "local ripgrep" });
    await remember(db, embedder, { content: "always use tabs", scope: "global" });
    await remember(db, embedder, { content: "alpha checkout limit", project: "alpha" });
    await remember(db, embedder, { content: "beta only note", project: "beta" });
    openWork(db, { title: "alpha refactor", project: "alpha" });
    openWork(db, { title: "beta cleanup", project: "beta" });
    setActive(db, { project: "alpha", author: "freebuff" });

    const result = await briefing(db, embedder);
    expect(result.project).toBe("alpha");
    expect(result.author).toBe("freebuff");
    expect(result.note).toBeNull();
    expect(result.tools.map((t) => t.name)).toEqual(["rg"]);
    expect(result.preferences.map((m) => m.content)).toEqual(["always use tabs"]);
    expect(result.open_work.map((w) => w.title)).toEqual(["alpha refactor"]);

    const contents = result.memories.map((m) => m.content);
    expect(contents).toContain("alpha checkout limit");
    expect(contents).not.toContain("beta only note");
    // an everywhere-note is delivered once, under preferences, not twice
    expect(contents).not.toContain("always use tabs");

    expect(result.store.memories_in_scope).toBe(2);
    expect(result.store.work_open).toBe(2);
    expect(result.store.tools).toBe(1);
  });

  test("an empty project briefing says so instead of guessing", async () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "nothing-here", author: null });
    const result = await briefing(db, fakeEmbedder());
    expect(result.memories).toEqual([]);
    expect(result.note).toContain("nothing recorded");
  });

  test("naming a target replaces what the office remembered", () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    setActive(db, { project: "~/Projects/beta", author: null });

    const scope = resolveScope(db);
    expect(scope.project).toBe(join(homedir(), "Projects", "beta"));
    expect(scope.author).toBeNull();
    expect(scope.project_source).toBe("active");
    expect(getActive(db)?.project).toBe(join(homedir(), "Projects", "beta"));
  });

  test("a declaration beats what the office remembers, field by field", () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });

    const scope = resolveScope(db, { project: "/somewhere/else" });
    expect(scope.project).toBe("/somewhere/else");
    expect(scope.project_source).toBe("declared");
    // the author was not restated, so the session's author still applies
    expect(scope.author).toBe("freebuff");
    expect(scope.author_source).toBe("active");
  });

  test("with nothing declared and nothing remembered, nothing is invented", () => {
    const db = tempDb();
    dbs.push(db);
    const scope = resolveScope(db);
    expect(scope.project).toBeNull();
    expect(scope.project_source).toBe("none");
  });
});
