import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canonicalizeProjects } from "../src/rekey";
import { gitCallCount, withProjectMemo } from "../src/scope";
import { listMemoriesInScope } from "../src/memory";
import { tempDb } from "./helpers";

function git(cwd: string, ...args: string[]) {
  const proc = Bun.spawnSync(["git", ...args], { cwd, env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null" } });
  if (proc.exitCode !== 0) throw new Error(proc.stderr.toString());
}

describe("renaming old project keys once", () => {
  let home: string;
  let previousHome: string | undefined;
  beforeEach(() => {
    previousHome = process.env.HOME;
    home = realpathSync(mkdtempSync(join(tmpdir(), "office-rekey-home-")));
    process.env.HOME = home;
  });
  afterEach(() => {
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
  });

  function project(name: string): string {
    const path = join(home, "Projects", name);
    mkdirSync(join(path, "review"), { recursive: true });
    git(path, "init", "-q");
    return path;
  }

  function insert(db: ReturnType<typeof tempDb>, value: string) {
    const now = new Date().toISOString();
    db.query("INSERT INTO memories (content, tags, created_at, project, scope) VALUES (?, '[]', ?, ?, 'project')")
      .run(`note for ${value}`, now, value);
    db.query("INSERT INTO work (title, project, created_at) VALUES (?, ?, ?)").run(`work for ${value}`, value, now);
    db.query("INSERT INTO issues (title, project, created_at) VALUES (?, ?, ?)").run(`issue for ${value}`, value, now);
  }

  const keys = (db: ReturnType<typeof tempDb>, table: string) =>
    (db.query(`SELECT DISTINCT project AS p FROM ${table} ORDER BY p`).all() as { p: string }[]).map((r) => r.p);

  test("plain names and subfolders become the repository's key, in every table", () => {
    const db = tempDb();
    const game = project("fencing-team-draft-game");
    const paper = project("payal-paper");
    insert(db, "fencing-team-draft-game");
    insert(db, join(paper, "review"));
    db.query("INSERT INTO session_state (author, project, updated_at) VALUES (?, ?, ?)")
      .run("codex-1111", join(paper, "review"), new Date().toISOString());

    const result = canonicalizeProjects(db);
    expect(result.renamed).toEqual({ "fencing-team-draft-game": game, [join(paper, "review")]: paper });
    for (const table of ["memories", "work", "issues"]) expect(keys(db, table)).toEqual([game, paper].sort());
    expect(keys(db, "session_state")).toEqual([paper]);
    db.close();
  });

  test("what cannot be resolved is left as it was, and plain names are reported", () => {
    const db = tempDb();
    insert(db, "no-folder-for-this");
    insert(db, "/nonexistent-office-test/moved-away");
    const result = canonicalizeProjects(db);
    expect(result.renamed).toEqual({});
    expect(result.unmapped).toEqual(["no-folder-for-this"]);
    expect(keys(db, "memories")).toEqual(["/nonexistent-office-test/moved-away", "no-folder-for-this"]);
    db.close();
  });

  test("the full pass runs once; later starts only retry plain names, without asking git", () => {
    const db = tempDb();
    const game = project("fencing-team-draft-game");
    insert(db, join(game, "review"));
    insert(db, "late-project");
    canonicalizeProjects(db);
    const before = gitCallCount();
    const again = canonicalizeProjects(db);
    expect(again.renamed).toEqual({});
    expect(gitCallCount()).toBe(before);
    // the folder for an old name appears later (say, on the laptop): the next start maps it
    const late = project("late-project");
    expect(canonicalizeProjects(db).renamed).toEqual({ "late-project": late });
    db.close();
  });
  test("a scoped read asks git about its own project only, however many are stored", () => {
    const db = tempDb();
    const mine = project("mine");
    for (let i = 0; i < 50; i++) insert(db, project(`other-${i}`));
    insert(db, mine);
    const before = gitCallCount();
    const rows = withProjectMemo(() => listMemoriesInScope(db, 10, mine));
    expect(rows.map((r) => r.project)).toEqual([mine]);
    expect(gitCallCount() - before).toBeLessThanOrEqual(1);
    db.close();
  });
});
