import type { Database } from "bun:sqlite";
import { existsSync, statSync } from "node:fs";
import { gitRootCommits } from "./scope";

/** Every table that files a record under a project, and the fingerprints. */
const RECORD_TABLES = ["memories", "work", "issues"] as const;

/**
 * A repository's fingerprint: its first commit (all of them, sorted, for a
 * history with several roots). It survives the folder being moved or renamed,
 * which is how the office can say "this looks like X, moved". Null when there
 * is nothing stable to recognise: no repository, no commits, or a shallow clone
 * whose "first" commit is only where the clone was cut.
 */
export function fingerprint(key: string): string | null {
  return gitRootCommits(key);
}

/**
 * Note a project's fingerprint the first time one can be read; after that it
 * costs nothing. A repository with no commits yet (or a git that failed) has
 * none, so nothing is stored and the next check-in tries again.
 */
export function recordProject(db: Database, key: string): void {
  const now = new Date().toISOString();
  if (db.query("SELECT 1 FROM projects WHERE key = ?").get(key)) {
    db.query("UPDATE projects SET seen_at = ? WHERE key = ?").run(now, key);
    return;
  }
  if (!existsSync(key)) return;
  const print = fingerprint(key);
  if (print) db.query("INSERT INTO projects (key, fingerprint, seen_at) VALUES (?, ?, ?)").run(key, print, now);
}

/** Two fingerprints are one history when they share a root commit (a later merge can add roots). */
function sameHistory(a: string, b: string): boolean {
  const roots = new Set(a.split(","));
  return b.split(",").some((root) => roots.has(root));
}

function isFolder(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/** Every stored project key, from the records and the fingerprints. */
function storedKeys(db: Database): string[] {
  const keys = new Set<string>();
  for (const table of [...RECORD_TABLES, "projects"]) {
    const column = table === "projects" ? "key" : "project";
    const rows = db
      .query(`SELECT DISTINCT ${column} AS p FROM ${table} WHERE ${column} IS NOT NULL`)
      .all() as { p: unknown }[];
    for (const row of rows) if (typeof row.p === "string" && row.p.startsWith("/")) keys.add(row.p);
  }
  return [...keys];
}

/** How many records a project has: its memories, work items and issues. */
export function recordCount(db: Database, key: string): number {
  let n = 0;
  for (const table of RECORD_TABLES) {
    n += (db.query(`SELECT COUNT(*) AS n FROM ${table} WHERE project = ?`).get(key) as { n: number }).n;
  }
  return n;
}

/**
 * Projects whose folder is not found, with how many records (memories, work,
 * issues) each still holds. Nothing is deleted: this is a label for the human
 * to decide on, and a folder on an unplugged drive shows here too. Only a stat
 * per key, no git, and only asked for by `office status` and the desk.
 */
export function goneProjects(db: Database): Array<{ project: string; records: number }> {
  return storedKeys(db)
    .filter((key) => !existsSync(key))
    .map((key) => ({ project: key, records: recordCount(db, key) }))
    .filter((gone) => gone.records > 0);
}

/**
 * Stored projects that share `key`'s history and whose folder is gone: the
 * places this repository may have been moved from. Only said when `key` has no
 * records of its own, because a project with its own notes is not a fresh move.
 */
export function likelyMovedFrom(db: Database, key: string): string[] {
  const mine = db.query("SELECT fingerprint FROM projects WHERE key = ?").get(key) as
    | { fingerprint: string | null }
    | null;
  if (!mine?.fingerprint || recordCount(db, key) > 0) return [];
  const rows = db
    .query("SELECT key, fingerprint FROM projects WHERE key <> ? AND fingerprint IS NOT NULL")
    .all(key) as { key: string; fingerprint: string }[];
  return rows
    .filter((row) => sameHistory(row.fingerprint, mine.fingerprint!))
    .map((row) => row.key)
    .filter((old) => !existsSync(old) && recordCount(db, old) > 0);
}

export type MoveResult =
  | { ok: true; moved: { memories: number; work: number; issues: number; sessions: number } }
  | { ok: false; reason: string };

/**
 * Bring a moved project's records from `from` to `to`, deliberately: this is
 * only ever run by a command, never decided by the office. Refused, moving
 * nothing, whenever it could merge two projects or take an original's notes.
 */
export function moveProject(db: Database, from: string, to: string): MoveResult {
  if (from === to) return { ok: false, reason: "that is this project already" };
  if (!to.startsWith("/") || !isFolder(to)) {
    return { ok: false, reason: `${to} is not a folder on this machine: nothing moved` };
  }
  if (recordCount(db, from) === 0) return { ok: false, reason: `${from} has no notes to move` };
  if (existsSync(from)) {
    return { ok: false, reason: `${from} still exists, so this is a copy of it, not a move: nothing moved` };
  }
  if (recordCount(db, to) > 0) {
    return {
      ok: false,
      reason: `${to} already has notes of its own, so moving would merge two projects: nothing moved. ` +
        "A move has to happen before anything is written in the new folder; ask the human",
    };
  }
  const prints = db
    .query("SELECT key, fingerprint FROM projects WHERE key IN (?, ?)")
    .all(from, to) as { key: string; fingerprint: string | null }[];
  const fromPrint = prints.find((p) => p.key === from)?.fingerprint ?? null;
  const toPrint = prints.find((p) => p.key === to)?.fingerprint ?? null;
  if (fromPrint && toPrint && !sameHistory(fromPrint, toPrint)) {
    return { ok: false, reason: `${from} has a different git history from ${to}: nothing moved` };
  }
  const moved = { memories: 0, work: 0, issues: 0, sessions: 0 };
  // Counted first: an UPDATE's change count includes the search index's own rows.
  const count = (table: string) =>
    (db.query(`SELECT COUNT(*) AS n FROM ${table} WHERE project = ?`).get(from) as { n: number }).n;
  db.transaction(() => {
    moved.memories = count("memories");
    moved.work = count("work");
    moved.issues = count("issues");
    moved.sessions = count("session_state");
    for (const table of ["memories", "work", "issues", "session_state"]) {
      db.query(`UPDATE ${table} SET project = ? WHERE project = ?`).run(to, from);
    }
    // The old key's fingerprint is the moved project's; the folder it named is gone.
    db.query("DELETE FROM projects WHERE key = ?").run(from);
  })();
  return { ok: true, moved };
}
