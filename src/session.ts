import type { Database } from "bun:sqlite";
import { SCOPE_GLOBAL, UNNAMED_SESSION, type SessionRow } from "./db";
import type { Embedder } from "./embed";
import { NO_PROJECT_NOTE, normalizeProject } from "./scope";
import {
  countInScope,
  countMemories,
  countUnattributed,
  listGlobalMemories,
  searchDetailed,
  type Hit,
  type Memory,
} from "./memory";
import {
  listWork,
  logChars,
  openWorkCount,
  recentEvents,
  workCount,
  type WorkEventSummary,
  type WorkItem,
} from "./work";
import { countTools, listTools, type Tool } from "./tools";

export const BRIEFING_MEMORIES = 6;
export const BRIEFING_WORK = 10;
export const BRIEFING_PREFERENCES = 12;
export const BRIEFING_NOTICES = 10;

/**
 * `ambiguous` is not a failure: it is the office declining to guess. More than
 * one *named* session is recorded and this call named no author, so the honest
 * answer is nothing rather than somebody else's name.
 */
export type ScopeSource = "declared" | "active" | "ambiguous" | "none";

export type Scope = {
  project: string | null;
  author: string | null;
  project_source: ScopeSource;
  author_source: ScopeSource;
  active_since: string | null;
};

export type AuthorWarning = { level: "warn" | "alert"; text: string };

type StoredSession = {
  /** The primary key: an author's name, or `''` for the unnamed slot. */
  key: string;
  project: string | null;
  author: string | null;
  updated_at: string;
};

type StoredRow = { author: string; project: string | null; updated_at: string };

function sessionKey(author: string | null | undefined): string {
  return author?.trim() || UNNAMED_SESSION;
}

function storedSessions(db: Database): StoredSession[] {
  const rows = db
    .query(
      `SELECT author, project, updated_at FROM session_state
       ORDER BY updated_at DESC, author ASC`,
    )
    .all() as StoredRow[];
  return rows.map((row) => ({
    key: row.author,
    project: row.project,
    author: row.author || null,
    updated_at: row.updated_at,
  }));
}

/** Every recorded session, newest check-in first. */
export function listSessions(db: Database): SessionRow[] {
  return storedSessions(db).map(({ project, author, updated_at }) => ({
    project,
    author,
    updated_at,
  }));
}

/** One author's row. The stored key is never null; the unnamed slot is `''`. */
export function getSession(db: Database, author: string | null | undefined): SessionRow | null {
  const row = db
    .query("SELECT project, author, updated_at FROM session_state WHERE author = ?")
    .get(sessionKey(author)) as StoredRow | null;
  if (!row) return null;
  return { project: row.project, author: row.author || null, updated_at: row.updated_at };
}

/**
 * The session this machine remembers, when there is only one to remember.
 * Two sessions and no declaration is not an answer, so nothing is returned.
 */
export function getActive(db: Database): SessionRow | null {
  const sessions = listSessions(db);
  return sessions.length === 1 ? sessions[0] : null;
}

/**
 * Record what this session is working on. Called by `office begin`, which is
 * the one moment a CLI is asked to name its target — every later write
 * inherits it, and a write that cannot resolve a project is stored
 * unattributed rather than guessed.
 *
 * The row is keyed by author, so this cannot touch another agent's session.
 * Only the fields this call declared are written — a field left out is kept,
 * not cleared, so `begin --by X` can no longer wipe X's remembered project as
 * a side effect of not repeating the flag.
 */
export function setActive(
  db: Database,
  input: { project?: string | null; author?: string | null },
): SessionRow | null {
  const project = input.project?.trim() ? normalizeProject(input.project) : null;
  const key = sessionKey(input.author);
  const now = new Date().toISOString();
  const existing = getSession(db, key === UNNAMED_SESSION ? null : key);
  if (existing) {
    db.query("UPDATE session_state SET project = ?, updated_at = ? WHERE author = ?").run(
      project ?? existing.project,
      now,
      key,
    );
  } else {
    db.query("INSERT INTO session_state (author, project, updated_at) VALUES (?, ?, ?)").run(
      key,
      project,
      now,
    );
  }
  return getSession(db, key === UNNAMED_SESSION ? null : key);
}

export type BeginResult = {
  /** The row as it was before this call: the handoff watermark. */
  previous: SessionRow | null;
  current: SessionRow | null;
};

/**
 * Start a session: remember the target, and report the row as it was first.
 * `previous` is the watermark "what happened since you were last here" is
 * measured against, and it only exists until the write below replaces it.
 *
 * The watermark is the caller's own row — a declared author has one, and a
 * caller that named nobody belongs to the unnamed slot. Reading it by identity
 * rather than resolving the machine's active session is what keeps a declared
 * author from being handed somebody else's history.
 */
export function beginSession(
  db: Database,
  input: { project?: string | null; author?: string | null },
): BeginResult {
  const author = input.author?.trim() || envAuthor();
  const project = input.project?.trim() ? normalizeProject(input.project) : envProject();
  const previous = getSession(db, author);
  const declared = author !== null || project !== null;
  return { previous, current: declared ? setActive(db, { project, author }) : null };
}

function envProject(): string | null {
  const raw = process.env.OFFICE_PROJECT ?? process.env.OFFICE_SOURCE;
  return raw?.trim() ? normalizeProject(raw) : null;
}

function envAuthor(): string | null {
  return process.env.OFFICE_AUTHOR?.trim() || null;
}

/**
 * Where the project and author come from, in order: what this call declared,
 * then what the office still remembers *when that is unambiguous*, then
 * nothing. Nothing is inferred from the working directory — agents are
 * started in the office itself and name their target out loud.
 *
 * Two rules decide what "unambiguous" means, and both exist because a wrong
 * attribution is invisible to exactly the agent it happens to suit:
 *
 * - A caller that named nobody belongs to the unnamed slot. That slot is not a
 *   person: it never makes the office ambiguous and it never answers with an
 *   author, so it can only hand back an anonymous project. This matters more
 *   than it looks — if an unnamed row counted toward ambiguity, then a single
 *   `begin --project` without a name would leave the machine unable to resolve
 *   a project for *any* undeclared caller from then on, permanently, which is
 *   a worse failure than the one being protected against.
 * - Failing that, the machine's only row is the single-agent convenience the
 *   office has always had. Two or more *named* sessions and no name is not an
 *   answer, so nothing is returned.
 */
export function resolveScope(
  db: Database,
  input: { project?: string | null; author?: string | null } = {},
): Scope {
  const declaredProject = input.project?.trim() ? normalizeProject(input.project) : envProject();
  const declaredAuthor = input.author?.trim() || envAuthor();

  const rows = storedSessions(db);
  const mine = declaredAuthor
    ? (rows.find((row) => row.key === sessionKey(declaredAuthor)) ?? null)
    : null;
  const unnamed = rows.find((row) => row.key === UNNAMED_SESSION) ?? null;
  const named = rows.filter((row) => row.key !== UNNAMED_SESSION);
  const remembered = declaredAuthor ? mine : (unnamed ?? (rows.length === 1 ? rows[0] : null));
  const ambiguous = !declaredAuthor && !remembered && named.length > 1;

  const project = declaredProject ?? remembered?.project ?? null;
  const author = declaredAuthor ?? remembered?.author ?? null;
  const authorSource: ScopeSource = declaredAuthor
    ? "declared"
    : remembered
      ? "active"
      : ambiguous
        ? "ambiguous"
        : "none";
  return {
    project,
    author,
    project_source: declaredProject ? "declared" : remembered?.project ? "active" : "none",
    author_source: authorSource,
    active_since: remembered?.updated_at ?? null,
  };
}

/**
 * What to say when a session declined to name itself. Silence only when the
 * name was actually declared — a default that is plausible for one agent is
 * invisible to exactly that agent, so the office says it out loud.
 */
export function authorWarnings(scope: Scope): AuthorWarning[] {
  if (scope.author_source === "declared") return [];
  if (scope.author_source === "active" && scope.author) {
    return [
      {
        level: "warn",
        text: `no --by declared; using the remembered session \`${scope.author}\`. A future release will require --by (or OFFICE_AUTHOR).`,
      },
    ];
  }
  if (scope.author_source === "active") {
    return [
      {
        level: "warn",
        text: "no --by declared; you are in the unnamed slot, so nothing is attributed to you. If another agent is using this office you are sharing that slot — pass --by <agent> or export OFFICE_AUTHOR.",
      },
    ];
  }
  if (scope.author_source === "ambiguous") {
    return [
      {
        level: "alert",
        text: "more than one session is recorded and this one named no author — this call inherits nothing and its writes stay unattributed rather than guessed. Pass --by <agent> or export OFFICE_AUTHOR.",
      },
    ];
  }
  return [
    {
      level: "warn",
      text: "no --by declared and no session recorded — writes will be stored unattributed. Pass --by <agent> or export OFFICE_AUTHOR.",
    },
  ];
}

export type SessionSummary = {
  author: string | null;
  project: string | null;
  since: string;
  is_you: boolean;
};

export type Briefing = {
  ok: true;
  project: string | null;
  project_source: ScopeSource;
  author: string | null;
  author_source: ScopeSource;
  active_since: string | null;
  tools: Tool[];
  preferences: Memory[];
  open_work: WorkItem[];
  memories: Hit[];
  /** Every session this machine remembers, newest check-in first. */
  sessions: SessionSummary[];
  /** What someone else did since *your* last `begin`. Empty on a first visit. */
  notices: WorkEventSummary[];
  notices_since: string | null;
  author_warnings: AuthorWarning[];
  store: {
    memories: number;
    memories_in_scope: number;
    unattributed: number;
    work_open: number;
    work_total: number;
    tools: number;
    log_chars: number;
  };
  note: string | null;
};

/**
 * Everything a fresh session should have before it starts work: the tools it
 * has, the preferences that apply everywhere, the work nobody finished, and
 * the memories for this project.
 *
 * It also volunteers what the caller did not ask for: who else is in the
 * building, and what they did since this author was last here.
 */
export async function briefing(
  db: Database,
  embedder: Embedder | null,
  opts: {
    since?: string | null;
    /** What this call declared, so the briefing reports it rather than the
     *  fallback it happens to match. */
    declared?: { project?: string | null; author?: string | null };
  } = {},
): Promise<Briefing> {
  const scope = resolveScope(db, opts.declared);
  const watermark = opts.since?.trim() || null;
  const result = await searchDetailed(db, embedder, "", BRIEFING_MEMORIES, {
    project: scope.project,
  });
  // Memories that apply everywhere are handed over above, in `preferences`.
  // Listing them again here would spend the agent's context twice on the same
  // text, which is the thing a briefing exists to avoid.
  const memories = result.hits.filter((hit) => hit.scope !== SCOPE_GLOBAL);
  let note: string | null = null;
  if (!memories.length) {
    note = scope.project
      ? `nothing recorded for ${scope.project} yet`
      : NO_PROJECT_NOTE;
  }
  return {
    ok: true,
    project: scope.project,
    project_source: scope.project_source,
    author: scope.author,
    author_source: scope.author_source,
    active_since: scope.active_since,
    tools: listTools(db),
    preferences: listGlobalMemories(db, BRIEFING_PREFERENCES),
    // Unfinished work is project-specific in the same way memories are: with no
    // project named, handing over every project's loose ends is the read the
    // scope rule exists to prevent. The note above says why it is empty.
    open_work: scope.project
      ? listWork(db, { project: scope.project, limit: BRIEFING_WORK })
      : [],
    memories,
    sessions: listSessions(db).map((session) => ({
      author: session.author,
      project: session.project,
      since: session.updated_at,
      is_you: session.author !== null && session.author === scope.author,
    })),
    // A first visit has no watermark, so it is handed the briefing rather
    // than the whole trail. "Since you were last here" needs a last time.
    notices: watermark
      ? recentEvents(db, {
          project: scope.project,
          since: watermark,
          excludeAuthor: scope.author,
          limit: BRIEFING_NOTICES,
        })
      : [],
    notices_since: watermark,
    author_warnings: authorWarnings(scope),
    store: {
      memories: countMemories(db),
      memories_in_scope: countInScope(db, scope.project),
      unattributed: countUnattributed(db),
      work_open: openWorkCount(db),
      work_total: workCount(db),
      tools: countTools(db),
      log_chars: logChars(db),
    },
    note,
  };
}
