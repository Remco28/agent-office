import type { Database } from "bun:sqlite";
import { matchingProjects } from "./scope";
import { logCap } from "./paths";
import type { WorkEventKind } from "./db";

export type WorkItem = {
  id: number;
  title: string;
  project: string | null;
  author: string | null;
  opened_at: string;
  /** Derived: a `close` event exists. Never a stored status. */
  closed: boolean;
  closed_at: string | null;
  events: number;
  last_at: string;
  last_note: string | null;
};

const ITEMS_SQL = `
  SELECT w.id, w.title, w.project, w.author, w.created_at,
         (SELECT COUNT(*) FROM work_events e WHERE e.work_id = w.id) AS events,
         (SELECT MAX(e.created_at) FROM work_events e WHERE e.work_id = w.id) AS last_at,
         (SELECT e.text FROM work_events e
           WHERE e.work_id = w.id AND e.kind = 'note'
           ORDER BY e.id DESC LIMIT 1) AS last_note,
         (SELECT MAX(e.created_at) FROM work_events e
           WHERE e.work_id = w.id AND e.kind = 'close') AS closed_at
  FROM work w
`;

type RawItem = {
  id: number;
  title: string;
  project: string | null;
  author: string | null;
  created_at: string;
  events: number;
  last_at: string | null;
  last_note: string | null;
  closed_at: string | null;
};

function toItem(row: RawItem): WorkItem {
  return {
    id: row.id,
    title: row.title,
    project: row.project,
    author: row.author,
    opened_at: row.created_at,
    closed: row.closed_at !== null,
    closed_at: row.closed_at,
    events: row.events,
    last_at: row.last_at ?? row.created_at,
    last_note: row.last_note,
  };
}

function insertEvent(
  db: Database,
  workId: number,
  kind: WorkEventKind,
  text: string,
  author: string | null,
): void {
  db.query(
    `INSERT INTO work_events (work_id, kind, text, author, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(workId, kind, text, author, new Date().toISOString());
}

export function getWork(db: Database, id: number): WorkItem | null {
  const row = db
    .query(`${ITEMS_SQL} WHERE w.id = ?`)
    .get(id) as RawItem | null;
  return row ? toItem(row) : null;
}

export function openWork(
  db: Database,
  input: { title: string; project?: string | null; author?: string | null },
): WorkItem {
  const title = input.title.trim();
  if (!title) throw new Error("work needs a title");
  const project = input.project?.trim() || null;
  const author = input.author?.trim() || null;
  const row = db
    .query(
      `INSERT INTO work (title, project, author, created_at)
       VALUES (?, ?, ?, ?)
       RETURNING id`,
    )
    .get(title, project, author, new Date().toISOString()) as { id: number };
  insertEvent(db, row.id, "open", title, author);
  void pruneLog(db);
  return getWork(db, row.id)!;
}

export function noteWork(
  db: Database,
  id: number,
  input: { text: string; author?: string | null },
): WorkItem {
  const text = input.text.trim();
  if (!text) throw new Error("note needs text");
  const item = getWork(db, id);
  if (!item) throw new Error(`no work #${id}`);
  if (item.closed) throw new Error(`work #${id} is already closed`);
  insertEvent(db, id, "note", text, input.author?.trim() || null);
  void pruneLog(db);
  return getWork(db, id)!;
}

export function closeWork(
  db: Database,
  id: number,
  input: { text?: string; author?: string | null } = {},
): WorkItem {
  const item = getWork(db, id);
  if (!item) throw new Error(`no work #${id}`);
  if (item.closed) throw new Error(`work #${id} is already closed`);
  insertEvent(db, id, "close", input.text?.trim() || "closed", input.author?.trim() || null);
  void pruneLog(db);
  return getWork(db, id)!;
}

export function listWork(
  db: Database,
  opts: { project?: string | null; includeClosed?: boolean; limit?: number } = {},
): WorkItem[] {
  const limit = Math.max(1, Math.min(opts.limit ?? 20, 200));
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.project) {
    const matches = matchingProjects(db, opts.project);
    if (!matches.length) return [];
    where.push(`w.project IN (${matches.map(() => "?").join(",")})`);
    params.push(...matches);
  }
  if (!opts.includeClosed) {
    where.push(
      `NOT EXISTS (SELECT 1 FROM work_events e WHERE e.work_id = w.id AND e.kind = 'close')`,
    );
  }
  const clause = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  const rows = db
    .query(
      `${ITEMS_SQL}${clause}
       ORDER BY COALESCE(last_at, w.created_at) DESC, w.id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as RawItem[];
  return rows.map(toItem);
}

export function openWorkCount(db: Database): number {
  const row = db
    .query(
      `SELECT COUNT(*) AS n FROM work w
       WHERE NOT EXISTS (
         SELECT 1 FROM work_events e WHERE e.work_id = w.id AND e.kind = 'close'
       )`,
    )
    .get() as { n: number };
  return row.n;
}

export function workCount(db: Database): number {
  const row = db.query("SELECT COUNT(*) AS n FROM work").get() as { n: number };
  return row.n;
}

/** Characters of trail currently stored (titles + event text). */
export function logChars(db: Database): number {
  const row = db
    .query(
      `SELECT
         (SELECT COALESCE(SUM(LENGTH(title)), 0) FROM work) +
         (SELECT COALESCE(SUM(LENGTH(text)), 0) FROM work_events) AS n`,
    )
    .get() as { n: number };
  return row.n;
}

/**
 * Keep the trail under a size cap by dropping the oldest *closed* work.
 * Open work is the handoff and is never pruned.
 */
export function pruneLog(db: Database, cap = logCap()): number {
  let chars = logChars(db);
  if (chars <= cap) return 0;
  const doomed = db
    .query(
      `SELECT w.id,
              LENGTH(w.title) + COALESCE(
                (SELECT SUM(LENGTH(e.text)) FROM work_events e WHERE e.work_id = w.id), 0
              ) AS size
       FROM work w
       WHERE EXISTS (SELECT 1 FROM work_events e WHERE e.work_id = w.id AND e.kind = 'close')
       ORDER BY w.created_at ASC, w.id ASC`,
    )
    .all() as { id: number; size: number }[];
  let removed = 0;
  for (const row of doomed) {
    if (chars <= cap) break;
    db.query("DELETE FROM work WHERE id = ?").run(row.id);
    chars -= row.size;
    removed += 1;
  }
  return removed;
}
