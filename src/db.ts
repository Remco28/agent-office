import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { dbPath } from "./paths";

export const SCOPE_PROJECT = "project";
export const SCOPE_GLOBAL = "global";

/**
 * Legacy `source` values that named the *agent* rather than the project. The
 * original schema had one free-text column doing both jobs; migration splits
 * it, and these names are the only way to tell the two apart after the fact.
 */
export const KNOWN_AGENTS = [
  "freebuff",
  "opencode",
  "claude",
  "claude-code",
  "codex",
  "cursor",
  "copilot",
  "aider",
  "gemini",
  "windsurf",
  "cline",
];

export type MemoryRow = {
  id: number;
  content: string;
  tags: string;
  project: string | null;
  author: string | null;
  scope: string;
  created_at: string;
  embedding: Uint8Array | null;
};

export type ToolRow = {
  id: number;
  name: string;
  summary: string;
  usage: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkEventKind = "open" | "note" | "close";

export type WorkEventRow = {
  id: number;
  work_id: number;
  kind: WorkEventKind;
  text: string;
  author: string | null;
  created_at: string;
};

export type WorkRow = {
  id: number;
  title: string;
  project: string | null;
  author: string | null;
  created_at: string;
};

export type SessionRow = {
  project: string | null;
  author: string | null;
  updated_at: string;
};

export function openDb(path = dbPath()): Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path, { create: true });
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA busy_timeout=5000");
  db.exec("PRAGMA foreign_keys=ON");
  migrate(db);
  return db;
}

const MEMORIES_DDL = `
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    project TEXT,
    author TEXT,
    scope TEXT NOT NULL DEFAULT 'project',
    created_at TEXT NOT NULL,
    embedding BLOB
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    content,
    tags,
    content='memories',
    content_rowid='id',
    tokenize='porter unicode61'
  );

  CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts(rowid, content, tags)
    VALUES (new.id, new.content, new.tags);
  END;

  CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, content, tags)
    VALUES ('delete', old.id, old.content, old.tags);
  END;

  CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, content, tags)
    VALUES ('delete', old.id, old.content, old.tags);
    INSERT INTO memories_fts(rowid, content, tags)
    VALUES (new.id, new.content, new.tags);
  END;
`;

/**
 * A work item and its trail. The trail is append-only: nothing is ever
 * updated, so "done" is not a field — it is the presence of a `close` event.
 * A CLI that dies mid-task leaves `open` and some notes and no closing line,
 * which is exactly the truth.
 */
const WORK_DDL = `
  CREATE TABLE IF NOT EXISTS work (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    project TEXT,
    author TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS work_events (
    id INTEGER PRIMARY KEY,
    work_id INTEGER NOT NULL REFERENCES work(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    author TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS work_events_work ON work_events(work_id);
  CREATE INDEX IF NOT EXISTS work_project ON work(project);
`;

const TOOLS_DDL = `
  CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    usage TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

/** One row, machine-wide: which project and agent is currently working. */
const SESSION_DDL = `
  CREATE TABLE IF NOT EXISTS session_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    project TEXT,
    author TEXT,
    updated_at TEXT NOT NULL
  );
`;

function tableExists(db: Database, name: string): boolean {
  const row = db
    .query("SELECT name FROM sqlite_master WHERE name = ?")
    .get(name) as { name: string } | null;
  return row !== null;
}

function migrate(db: Database): void {
  const hadFts = tableExists(db, "memories_fts");
  const hadMemories = tableExists(db, "memories");
  db.exec(MEMORIES_DDL);
  // An external-content FTS table created over a table that already has rows
  // starts empty, and the triggers only fire on future writes. A store written
  // before search existed would be unsearchable without this rebuild.
  if (!hadFts && hadMemories) {
    db.exec("INSERT INTO memories_fts(memories_fts) VALUES('rebuild')");
  }
  ensureMemoryColumns(db);
  db.exec(WORK_DDL);
  db.exec(TOOLS_DDL);
  db.exec(SESSION_DDL);
  backfillAttribution(db);
}

function memoryColumns(db: Database): Set<string> {
  const rows = db.query("PRAGMA table_info(memories)").all() as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

function ensureMemoryColumns(db: Database): void {
  const have = memoryColumns(db);
  const wanted: [name: string, decl: string][] = [
    ["project", "TEXT"],
    ["author", "TEXT"],
    ["scope", "TEXT NOT NULL DEFAULT 'project'"],
  ];
  for (const [name, decl] of wanted) {
    if (!have.has(name)) db.exec(`ALTER TABLE memories ADD COLUMN ${name} ${decl}`);
  }
}

/**
 * Split the legacy `source` column into project and author. Runs once: after
 * this every row either has a project, an author, or was written after the
 * split (and so has nothing to backfill from).
 */
function backfillAttribution(db: Database): void {
  if (!memoryColumns(db).has("source")) return;
  const agents = KNOWN_AGENTS.map((name) => `'${name}'`).join(",");
  db.query(
    `UPDATE memories SET author = source
     WHERE project IS NULL AND author IS NULL AND source IS NOT NULL
       AND lower(source) IN (${agents})`,
  ).run();
  db.query(
    `UPDATE memories SET project = source
     WHERE project IS NULL AND author IS NULL AND source IS NOT NULL`,
  ).run();
}

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // stored as comma-separated fallback
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function dumpTags(tags: string[] | undefined): string {
  const unique = [...new Set((tags ?? []).map((t) => t.trim()).filter(Boolean))];
  return JSON.stringify(unique);
}
