import type { Database } from "bun:sqlite";
import { clampLimit, type IssueEventKind } from "./db";
import { normalizeProject } from "./scope";

export type Issue = {
  id: number;
  title: string;
  /** Where it surfaced. Context for whoever triages it, never a filter. */
  project: string | null;
  author: string | null;
  opened_at: string;
  /** Derived: a `close` event exists. Never a stored status. */
  closed: boolean;
  closed_at: string | null;
  closed_by: string | null;
  /** The closing line. Closing one without it is refused. */
  resolution: string | null;
  events: number;
  last_at: string;
  last_note: string | null;
  last_note_author: string | null;
};

const ISSUES_SQL = `
  SELECT i.id, i.title, i.project, i.author, i.created_at,
         (SELECT COUNT(*) FROM issue_events e WHERE e.issue_id = i.id) AS events,
         (SELECT MAX(e.created_at) FROM issue_events e WHERE e.issue_id = i.id) AS last_at,
         (SELECT e.text FROM issue_events e
           WHERE e.issue_id = i.id AND e.kind = 'note'
           ORDER BY e.id DESC LIMIT 1) AS last_note,
         (SELECT e.author FROM issue_events e
           WHERE e.issue_id = i.id AND e.kind = 'note'
           ORDER BY e.id DESC LIMIT 1) AS last_note_author,
         (SELECT e.created_at FROM issue_events e
           WHERE e.issue_id = i.id AND e.kind = 'close'
           ORDER BY e.id DESC LIMIT 1) AS closed_at,
         (SELECT e.author FROM issue_events e
           WHERE e.issue_id = i.id AND e.kind = 'close'
           ORDER BY e.id DESC LIMIT 1) AS closed_by,
         (SELECT e.text FROM issue_events e
           WHERE e.issue_id = i.id AND e.kind = 'close'
           ORDER BY e.id DESC LIMIT 1) AS resolution
  FROM issues i
`;

type RawIssue = {
  id: number;
  title: string;
  project: string | null;
  author: string | null;
  created_at: string;
  events: number;
  last_at: string | null;
  last_note: string | null;
  last_note_author: string | null;
  closed_at: string | null;
  closed_by: string | null;
  resolution: string | null;
};

function toIssue(row: RawIssue): Issue {
  return {
    id: row.id,
    title: row.title,
    project: row.project,
    author: row.author,
    opened_at: row.created_at,
    closed: row.closed_at !== null,
    closed_at: row.closed_at,
    closed_by: row.closed_by,
    resolution: row.resolution,
    events: row.events,
    last_at: row.last_at ?? row.created_at,
    last_note: row.last_note,
    last_note_author: row.last_note_author,
  };
}

function insertEvent(
  db: Database,
  issueId: number,
  kind: IssueEventKind,
  text: string,
  author: string | null,
): void {
  db.query(
    `INSERT INTO issue_events (issue_id, kind, text, author, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(issueId, kind, text, author, new Date().toISOString());
}

export function getIssue(db: Database, id: number): Issue | null {
  const row = db.query(`${ISSUES_SQL} WHERE i.id = ?`).get(id) as RawIssue | null;
  return row ? toIssue(row) : null;
}

export function openIssue(
  db: Database,
  input: { title: string; project?: string | null; author?: string | null },
): Issue {
  const title = input.title.trim();
  if (!title) throw new Error("an issue needs a title");
  const project = input.project?.trim() ? normalizeProject(input.project) : null;
  const author = input.author?.trim() || null;
  const row = db
    .query(
      `INSERT INTO issues (title, project, author, created_at)
       VALUES (?, ?, ?, ?)
       RETURNING id`,
    )
    .get(title, project, author, new Date().toISOString()) as { id: number };
  insertEvent(db, row.id, "open", title, author);
  return getIssue(db, row.id)!;
}

export function noteIssue(
  db: Database,
  id: number,
  input: { text: string; author?: string | null },
): Issue {
  const text = input.text.trim();
  if (!text) throw new Error("note needs text");
  const issue = getIssue(db, id);
  if (!issue) throw new Error(`no issue #${id}`);
  if (issue.closed) throw new Error(`issue #${id} is already closed`);
  insertEvent(db, id, "note", text, input.author?.trim() || null);
  return getIssue(db, id)!;
}

/**
 * Unlike a work item, an issue cannot be closed with a bare "closed": the
 * resolution line is the only thing the filer, who may still be mid-session
 * days later, has to judge whether the problem was fixed or merely dropped.
 */
export function closeIssue(
  db: Database,
  id: number,
  input: { text: string; author?: string | null },
): Issue {
  const text = input.text.trim();
  if (!text) throw new Error("closing an issue needs a resolution line: what changed, or why not");
  const issue = getIssue(db, id);
  if (!issue) throw new Error(`no issue #${id}`);
  if (issue.closed) throw new Error(`issue #${id} is already closed`);
  insertEvent(db, id, "close", text, input.author?.trim() || null);
  return getIssue(db, id)!;
}

/** Issues are about the office, so there is no scope to ask for — only how many. */
export function listIssues(
  db: Database,
  opts: { includeClosed?: boolean; limit?: number } = {},
): Issue[] {
  const limit = clampLimit(opts.limit, 20, 200);
  const clause = opts.includeClosed
    ? ""
    : ` WHERE NOT EXISTS (SELECT 1 FROM issue_events e WHERE e.issue_id = i.id AND e.kind = 'close')`;
  const rows = db
    .query(
      `${ISSUES_SQL}${clause}
       ORDER BY COALESCE(last_at, i.created_at) DESC, i.id DESC
       LIMIT ?`,
    )
    .all(limit) as RawIssue[];
  return rows.map(toIssue);
}

export function openIssueCount(db: Database): number {
  const row = db
    .query(
      `SELECT COUNT(*) AS n FROM issues i
       WHERE NOT EXISTS (
         SELECT 1 FROM issue_events e WHERE e.issue_id = i.id AND e.kind = 'close'
       )`,
    )
    .get() as { n: number };
  return row.n;
}

/**
 * Issues this author filed that someone else closed after `since` — the answer
 * to "did anything come of what I raised", for a session that may have been
 * running for days. Closing your own is not news to you.
 */
export function closedSince(
  db: Database,
  opts: { author: string | null; since: string | null; limit?: number },
): Issue[] {
  if (!opts.author || !opts.since) return [];
  const limit = clampLimit(opts.limit, 10, 50);
  const rows = db
    .query(
      `${ISSUES_SQL}
       WHERE i.author = ?
         AND EXISTS (
           SELECT 1 FROM issue_events e
           WHERE e.issue_id = i.id AND e.kind = 'close'
             AND e.created_at > ? AND (e.author IS NULL OR e.author <> ?)
         )
       ORDER BY i.id DESC
       LIMIT ?`,
    )
    .all(opts.author, opts.since, opts.author, limit) as RawIssue[];
  return rows.map(toIssue);
}
