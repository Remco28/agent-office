import { describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { fakeEmbedder } from "../src/embed";
import { remember } from "../src/memory";
import { matchingProjects, normalizeProject, projectKey, scopeClause } from "../src/scope";
import { tempDb } from "./helpers";

describe("project scope", () => {
  test("normalizeProject expands ~ and drops trailing slashes", () => {
    expect(normalizeProject("~/Projects/x/")).toBe(join(homedir(), "Projects", "x"));
    expect(normalizeProject("agent-office")).toBe("agent-office");
    expect(normalizeProject("  ")).toBe("");
    expect(projectKey("~/Projects/Agent-Office")).toBe("agent-office");
  });

  test("a legacy slug still answers when you name the folder", async () => {
    const db = tempDb();
    await remember(db, fakeEmbedder(), {
      content: "60 req/min per IP",
      project: "fencing-team-draft-game",
    });
    expect(matchingProjects(db, "~/Projects/fencing-team-draft-game")).toEqual([
      "fencing-team-draft-game",
    ]);
    expect(matchingProjects(db, "~/Projects/something-else")).toEqual([]);
    db.close();
  });

  test("two real paths with the same folder name stay apart", async () => {
    const db = tempDb();
    await remember(db, fakeEmbedder(), { content: "work api", project: "/work/api" });
    await remember(db, fakeEmbedder(), { content: "home api", project: "/home/api" });
    expect(matchingProjects(db, "/work/api")).toEqual(["/work/api"]);
    expect(matchingProjects(db, "/home/api")).toEqual(["/home/api"]);
    db.close();
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

  test("a project only known from the log is still a known project", () => {
    const db = tempDb();
    db.query(
      "INSERT INTO work (title, project, author, created_at) VALUES (?, ?, ?, ?)",
    ).run("photos", "~/Pictures/2019", null, new Date().toISOString());
    expect(matchingProjects(db, "~/Pictures/2019")).toEqual(["~/Pictures/2019"]);
    db.close();
  });
});
