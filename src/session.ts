import type { Database } from "bun:sqlite";
import { SCOPE_GLOBAL, UNNAMED_SESSION, type SessionRow } from "./db";
import type { Embedder } from "./embed";
import {
  NO_PROJECT_NOTE,
  RECENT_ACTIVITY_NOTE,
  UNCLAIMED_WORK_NOTE,
  normalizeProject,
} from "./scope";
import { formatAgo } from "./stats";
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
  unclaimedWorkCount,
  workCount,
  type WorkEventSummary,
  type WorkItem,
} from "./work";
import { countTools, listTools, type Tool } from "./tools";

export const BRIEFING_MEMORIES = 6;
export const BRIEFING_WORK = 10;
export const BRIEFING_PREFERENCES = 12;
export const BRIEFING_NOTICES = 10;
/** Sessions a briefing names: the ones seen recently, at most this many. */
export const BRIEFING_SESSIONS = 8;
export const SESSION_RECENT_DAYS = 14;
/** A session not seen for this long is dropped at the next check-in. */
export const SESSION_PRUNE_DAYS = 30;

const DAY_MS = 86_400_000;

/** A numbered instance: the base name, a dash, four digits. */
const INSTANCE_RE = /-\d{4}$/;

/**
 * One spelling per name. `Codex`, `codex` and `codex ` used to be three
 * people; lowercased, with runs of whitespace as one dash, they are one.
 */
export function normalizeAuthor(raw: string | null | undefined): string | null {
  const value = raw?.trim().toLowerCase().replace(/\s+/g, "-");
  return value || null;
}

export type Identity = {
  author: string | null;
  /** True when this check-in was given a new numbered name. */
  minted: boolean;
};

/**
 * The name this check-in will be known by.
 *
 * A bare name like `codex` says which tool is running, not which run it is:
 * launch Codex three times and there were three agents called `codex`, each
 * inheriting the last one's watermark and indistinguishable in the record.
 * So a bare name is given a number — `codex-4821` — and that number is the
 * run. Naming an existing numbered session resumes it; a resumed harness
 * still has its name in context, which is exactly when resuming is right.
 */
export function claimIdentity(db: Database, raw: string | null | undefined): Identity {
  const author = normalizeAuthor(raw);
  if (!author) return { author: null, minted: false };
  if (INSTANCE_RE.test(author)) return { author, minted: false };
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = `${author}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    if (!getSession(db, candidate)) return { author: candidate, minted: true };
  }
  throw new Error(`could not find a free number for ${author}`);
}

/**
 * Drop sessions nobody has checked in as for a month. Every launch is a new
 * numbered session now, so without this the table — and every briefing that
 * lists it — only grows. `keep` is the caller, whose own row is never pruned
 * out from under it.
 */
export function pruneSessions(
  db: Database,
  keep: string | null,
  now = Date.now(),
  days = SESSION_PRUNE_DAYS,
): number {
  const cutoff = new Date(now - days * DAY_MS).toISOString();
  return db
    .query("DELETE FROM session_state WHERE updated_at < ? AND author <> ?")
    .run(cutoff, sessionKey(keep)).changes;
}

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
  return normalizeAuthor(author) ?? UNNAMED_SESSION;
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
  // The name is whatever the caller declared — there is deliberately no
  // process.env fallback here. This runs inside the daemon, and the daemon is a
  // long-lived shared process whose environment belongs to whoever started it,
  // not to the caller. See resolveScope for the full reasoning.
  const author = normalizeAuthor(input.author);
  const project = input.project?.trim() ? normalizeProject(input.project) : null;
  const previous = getSession(db, author);
  const declared = author !== null || project !== null;
  return { previous, current: declared ? setActive(db, { project, author }) : null };
}

/**
 * The same visit as `beginSession`, with every write removed: the caller's own
 * check-in mark is read and left exactly where it was, and no session row is
 * created or touched.
 *
 * This exists because `begin` is the office's front door and it changes the
 * record. An agent told not to modify state is right to refuse it, and the more
 * careful the agent, the more certain that refusal — so the most careful
 * agents were the ones locked out. A peek is the honest alternative: the same
 * briefing, nothing written.
 *
 * The mark returned is the caller's own row, so "since you were last here"
 * stays true — but because nothing moved it, the same notices recur until a
 * real check-in advances it. A peek reports that rather than pretending the
 * visit was a check-in.
 */
export function peekSession(
  db: Database,
  input: { project?: string | null; author?: string | null } = {},
): BeginResult {
  const author = normalizeAuthor(input.author);
  return { previous: getSession(db, author), current: null };
}

/**
 * Where the project and author come from, in order: what this call declared,
 * then what the office still remembers *when that is unambiguous*, then
 * nothing. Nothing is inferred from the working directory — agents are
 * started in the office itself and name their target out loud.
 *
 * Project and author do not follow the same rule, and the difference is the
 * point of this function:
 *
 * - The **project** may come from a remembered session. A project is not an
 *   identity: a wrong one is visible in the record, and the single-agent
 *   convenience is real. An undeclared caller belongs to the unnamed slot,
 *   which is not a person — it never makes the office ambiguous and can only
 *   hand back an anonymous project. This matters more than it looks: if an
 *   unnamed row counted toward ambiguity, then a single `begin --project`
 *   without a name would leave the machine unable to resolve a project for
 *   *any* undeclared caller from then on, permanently, which is a worse
 *   failure than the one being protected against. Failing the unnamed slot,
 *   the machine's only row is the convenience the office has always had. Two
 *   or more *named* sessions and no name is not an answer, so nothing is
 *   returned.
 * - The **author is never inherited.** It is only ever declared. A caller that
 *   named nobody gets no name at all — not even the machine's only one. That
 *   fallback is exactly how one agent's work came to be signed with another
 *   agent's name, silently: the wrong name is invisible to precisely the agent
 *   it happens to be right for, who therefore has no reason to look. An
 *   anonymous write shows up as a gap somebody can close; a plausible one
 *   never does.
 *
 * `OFFICE_PROJECT`/`OFFICE_AUTHOR` are resolved by the *caller*, never here.
 * This function runs inside the daemon — a long-lived, shared process — so its
 * environment belongs to whoever started it. A daemon started with
 * `OFFICE_AUTHOR=probe` would otherwise sign every unnamed write on the machine
 * with that name and report it as `declared`. The CLI folds its own
 * environment into the request body; a caller that reaches the daemon directly
 * must put the name and project there too.
 */
export function resolveScope(
  db: Database,
  input: { project?: string | null; author?: string | null } = {},
): Scope {
  const declaredProject = input.project?.trim() ? normalizeProject(input.project) : null;
  const declaredAuthor = normalizeAuthor(input.author);

  const rows = storedSessions(db);
  const mine = declaredAuthor
    ? (rows.find((row) => row.key === sessionKey(declaredAuthor)) ?? null)
    : null;
  const unnamed = rows.find((row) => row.key === UNNAMED_SESSION) ?? null;
  const named = rows.filter((row) => row.key !== UNNAMED_SESSION);
  const remembered = declaredAuthor ? mine : (unnamed ?? (rows.length === 1 ? rows[0] : null));
  const ambiguous = !declaredAuthor && !remembered && named.length > 1;

  const project = declaredProject ?? remembered?.project ?? null;
  // Only ever declared — the remembered name is not borrowed. See the note
  // above: lending it is how the office signed one agent's work with
  // another's, and the agent it suited had no reason to look.
  const author = declaredAuthor ?? null;
  const authorSource: ScopeSource = declaredAuthor
    ? "declared"
    : ambiguous
      ? "ambiguous"
      : remembered
        ? "active"
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
  if (scope.author_source === "active") {
    return [
      {
        level: "warn",
        text: "no --by declared; you are in the unnamed slot, so nothing is attributed to you — the office will not sign your work with a session it merely remembers. Pass --by <agent> or export OFFICE_AUTHOR.",
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
  /**
   * The same moment in plain words ("7d ago"). A bare timestamp reads as
   * though the session were still running, which is how a session that ended
   * a week ago is mistaken for a colleague who is here now.
   */
  last_seen: string;
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
  /** Why the open work above is the unclaimed set, when there was no project
   *  to scope it to. Null when it was scoped normally. */
  open_work_note: string | null;
  memories: Hit[];
  /**
   * Sessions seen in the last two weeks, newest first, at most eight — plus
   * the caller. The full list grew with every launch and was handed to every
   * agent on every check-in.
   */
  sessions: SessionSummary[];
  /** Sessions remembered but left out of the list above. */
  sessions_hidden: number;
  /** Said when this check-in was given a numbered name, so the agent uses it. */
  identity_note: string | null;
  /**
   * What someone else did since *your* last `begin` — or, for an agent that
   * has never been here, the project's most recent activity. Never empty just
   * because the caller is new.
   */
  notices: WorkEventSummary[];
  notices_since: string | null;
  /** Why the notices above are framed the way they are, when the frame is not
   *  "since your own last visit". */
  notices_note: string | null;
  /** True when nothing was written: this briefing came from a read-only visit. */
  readonly: boolean;
  /** Why a read-only visit's notices may repeat, when there is anything to repeat. */
  readonly_note: string | null;
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
    /** A visit that wrote nothing, so the notice watermark did not move. */
    readonly?: boolean;
    /** This check-in was given a new numbered name. */
    minted?: boolean;
    now?: number;
  } = {},
): Promise<Briefing> {
  const scope = resolveScope(db, opts.declared);
  const readOnly = Boolean(opts.readonly);
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
  // Unfinished work is project-specific in the same way memories are. With no
  // project named the office does not hand over every project's loose ends —
  // but it is not silent either: the items filed with no project at all belong
  // to nobody, so showing them cannot lend anyone the wrong work, and it is
  // the only way an orphaned handoff is ever found again.
  const openWork = scope.project
    ? listWork(db, { kind: "project", project: scope.project }, { limit: BRIEFING_WORK })
    : listWork(db, { kind: "unclaimed" }, { limit: BRIEFING_WORK });
  // A watermark is a personal thing — it means "since *you* were here". A
  // fresh agent has none, and answering that with nothing is what sends a
  // stranger hunting the machine for changes it never made. So a stranger is
  // handed the recent activity instead, framed and labelled rather than
  // implied.
  const notices = watermark
    ? recentEvents(db, {
        project: scope.project,
        since: watermark,
        excludeAuthor: scope.author,
        limit: BRIEFING_NOTICES,
      })
    : recentEvents(db, { project: scope.project, latest: true, limit: BRIEFING_NOTICES });
  const recentCutoff = new Date((opts.now ?? Date.now()) - SESSION_RECENT_DAYS * DAY_MS).toISOString();
  const allSessions = listSessions(db);
  const shown = allSessions
    .filter(
      (session, index) =>
        (session.author !== null && session.author === scope.author) ||
        (session.updated_at >= recentCutoff && index < BRIEFING_SESSIONS),
    );
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
    open_work: openWork,
    open_work_note: scope.project || !openWork.length ? null : UNCLAIMED_WORK_NOTE,
    memories,
    sessions: shown.map((session) => ({
      author: session.author,
      project: session.project,
      since: session.updated_at,
      last_seen: formatAgo(session.updated_at),
      is_you: session.author !== null && session.author === scope.author,
    })),
    sessions_hidden: allSessions.length - shown.length,
    identity_note:
      opts.minted && scope.author
        ? `you are ${scope.author} for this run — pass --by ${scope.author} on every call ` +
          `(or export OFFICE_AUTHOR=${scope.author}); begin with that name again to resume`
        : null,
    notices,
    notices_since: watermark,
    notices_note: !watermark && notices.length ? RECENT_ACTIVITY_NOTE : null,
    readonly: readOnly,
    readonly_note: readOnly
      ? watermark
        ? "nothing was written; your check-in time did not move, so the notices above will be shown again until a begin moves it"
        : "nothing was written; you have no previous check-in of your own, so the activity above is the office's most recent rather than a since-you-were-last-here list, and it will read the same until you begin"
      : null,
    author_warnings: authorWarnings(scope),
    store: {
      memories: countMemories(db),
      memories_in_scope: countInScope(db, scope.project),
      // Records no project-scoped read can find: memories filed with no
      // project, and work filed with no project. Both are handoffs waiting to
      // be adopted, so they are counted together and out loud.
      unattributed: countUnattributed(db) + unclaimedWorkCount(db),
      work_open: openWorkCount(db),
      work_total: workCount(db),
      tools: countTools(db),
      log_chars: logChars(db),
    },
    note,
  };
}
