import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db";
import { fakeEmbedder } from "../src/embed";
import { search } from "../src/memory";
import { listSessions, resolveScope } from "../src/session";

/** The schema as it was before `source` was split into project and author. */
const OLD_SCHEMA = `
  CREATE TABLE memories (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    source TEXT,
    created_at TEXT NOT NULL,
    embedding BLOB
  );
`;

/** The session table as it was: one machine-wide row, which two agents shared. */
const OLD_SESSION = `
  CREATE TABLE session_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    project TEXT,
    author TEXT,
    updated_at TEXT NOT NULL
  );
`;

function legacyStore(): string {
  const dir = mkdtempSync(join(tmpdir(), "office-legacy-"));
  const path = join(dir, "memory.db");
  const db = new Database(path, { create: true });
  db.exec(OLD_SCHEMA);
  const insert = db.query(
    "INSERT INTO memories (content, tags, source, created_at) VALUES (?, ?, ?, ?)",
  );
  const now = new Date().toISOString();
  insert.run("keep checkout under 60 req/min", '["convention"]', "fencing-team-draft-game", now);
  insert.run("prefer local tools over web search", '["convention"]', "freebuff", now);
  insert.run("run.sh added", '["status"]', "crokinole", now);
  db.close();
  return path;
}

type Row = {
  content: string;
  project: string | null;
  author: string | null;
  scope: string;
};

describe("migration", () => {
  test("a project name becomes the project, an agent name becomes the author", () => {
    const db = openDb(legacyStore());
    const rows = db.query(
      "SELECT content, project, author, scope FROM memories ORDER BY id",
    ).all() as Row[];

    expect(rows.map((r) => r.project)).toEqual([
      "fencing-team-draft-game",
      null,
      "crokinole",
    ]);
    expect(rows.map((r) => r.author)).toEqual([null, "freebuff", null]);
    expect(rows.every((r) => r.scope === "project")).toBe(true);
    db.close();
  });

  test("the index is rebuilt, so old rows are searchable right away", async () => {
    const db = openDb(legacyStore());
    const hits = await search(db, fakeEmbedder(), "checkout 60", 5, {
      project: "fencing-team-draft-game",
    });
    expect(hits.map((h) => h.content)).toContain("keep checkout under 60 req/min");
    db.close();
  });

  test("running the migration again changes nothing", () => {
    const path = legacyStore();
    const first = openDb(path);
    const before = first.query("SELECT content, project, author, scope FROM memories ORDER BY id").all();
    first.close();

    const second = openDb(path);
    const after = second.query("SELECT content, project, author, scope FROM memories ORDER BY id").all();
    expect(after).toEqual(before);
    second.close();
  });

  test("the one machine-wide session row becomes that author's row", () => {
    const dir = mkdtempSync(join(tmpdir(), "office-legacy-session-"));
    const path = join(dir, "memory.db");
    const raw = new Database(path, { create: true });
    raw.exec(OLD_SCHEMA);
    raw.exec(OLD_SESSION);
    raw
      .query("INSERT INTO session_state (id, project, author, updated_at) VALUES (1, ?, ?, ?)")
      .run("/p/alpha", "freebuff", "2026-09-21T00:00:00.000Z");
    raw.close();

    const db = openDb(path);
    expect(db.query("SELECT author, project, updated_at FROM session_state").all()).toEqual([
      { author: "freebuff", project: "/p/alpha", updated_at: "2026-09-21T00:00:00.000Z" },
    ]);
    db.close();
  });

  test("a session that never named an author keeps working on its own", () => {
    const dir = mkdtempSync(join(tmpdir(), "office-legacy-session-"));
    const path = join(dir, "memory.db");
    const raw = new Database(path, { create: true });
    raw.exec(OLD_SCHEMA);
    raw.exec(OLD_SESSION);
    raw
      .query("INSERT INTO session_state (id, project, author, updated_at) VALUES (1, ?, NULL, ?)")
      .run("/p/alpha", "2026-09-21T00:00:00.000Z");
    raw.close();

    const db = openDb(path);
    // one row, so it still answers — a single-agent machine is unaffected
    expect(resolveScope(db).project).toBe("/p/alpha");
    expect(resolveScope(db).author).toBeNull();
    expect(listSessions(db)).toHaveLength(1);
    db.close();
  });

  test("a store written before the log existed gains one without losing memories", () => {
    const path = legacyStore();
    const db = openDb(path);
    const work = db.query("SELECT COUNT(*) AS n FROM work").get() as { n: number };
    const tools = db.query("SELECT COUNT(*) AS n FROM tools").get() as { n: number };
    const memories = db.query("SELECT COUNT(*) AS n FROM memories").get() as { n: number };
    expect(work.n).toBe(0);
    expect(tools.n).toBe(0);
    expect(memories.n).toBe(3);
    db.close();
  });
});
