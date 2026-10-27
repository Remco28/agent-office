import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalizeProject, scopeClause, scopeProjects } from "../src/scope";

describe("project scope", () => {
  // A temporary home with its own ~/Projects, so nothing here looks at this machine's folders.
  let home: string;
  let previousHome: string | undefined;
  beforeEach(() => {
    previousHome = process.env.HOME;
    home = realpathSync(mkdtempSync(join(tmpdir(), "office-scope-home-")));
    mkdirSync(join(home, "Projects", "crokinole"), { recursive: true });
    process.env.HOME = home;
  });
  afterEach(() => {
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
  });

  test("normalizeProject expands ~ and drops trailing slashes", () => {
    expect(normalizeProject("~/Projects/x/")).toBe(join(home, "Projects", "x"));
    expect(normalizeProject("  ")).toBe("");
  });

  test("a bare name is the folder of that name in ~/Projects, when there is one", () => {
    expect(normalizeProject("crokinole")).toBe(join(home, "Projects", "crokinole"));
    // no such folder: the name is kept as typed
    expect(normalizeProject("no-such-project")).toBe("no-such-project");
    expect(normalizeProject("src")).toBe("src");
  });

  test("a read matches exactly one key, its own", () => {
    expect(scopeProjects("/work/api")).toEqual(["/work/api"]);
    expect(scopeProjects("crokinole")).toEqual([join(home, "Projects", "crokinole")]);
    expect(scopeProjects("  ")).toEqual([]);
  });

  test("an empty match list is the everywhere notes, not an open filter", () => {
    // This is the whole scoping rule in one place: a session with no project,
    // and a project name nobody has heard of, both land here. Reading the
    // whole store is something a caller has to ask for by name.
    expect(scopeClause([])).toEqual({ sql: " AND scope = 'global'", params: [] });
    const scoped = scopeClause(["alpha"]);
    expect(scoped.sql).toContain("scope = 'global' OR project IN (?)");
    expect(scoped.params).toEqual(["alpha"]);
  });
});
