import type { Database } from "bun:sqlite";
import type { SessionRow } from "./db";
import type { Embedder } from "./embed";
import {
  NO_PROJECT_NOTE,
  RECENT_ACTIVITY_NOTE,
  UNCLAIMED_WORK_NOTE,
  displayName,
  normalizeProject,
} from "./scope";
import { formatAgo } from "./stats";
import {
  countInScope,
  countMemories,
  countUnattributed,
  listGlobalMemories,
  listMemoriesInScope,
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
import { listSkills, type Skill, type SkillProblem } from "./skills";
import { likelyMovedFrom } from "./moves";
import { skillsDir } from "./paths";
import { closedSince, listIssues, openIssueCount, type Issue } from "./issues";

export const BRIEFING_MEMORIES = 6;
export const BRIEFING_WORK = 10;
export const BRIEFING_PREFERENCES = 12;
export const BRIEFING_NOTICES = 10;
/** Open issues a briefing lists; the rest are counted, and `office issues` has them. */
export const BRIEFING_ISSUES = 5;
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
    .run(cutoff, normalizeAuthor(keep) ?? "").changes;
}

/** Where a project or an author came from. Nothing is ever taken from memory. */
export type ScopeSource = "declared" | "folder" | "none";

export type Scope = {
  project: string | null;
  author: string | null;
  project_source: ScopeSource;
  author_source: ScopeSource;
  active_since: string | null;
  /**
   * Said when the folder decided the project and this session's own record
   * named a different one, when --project names one the folder does not, or
   * when a name is not the numbered one a check-in hands out. Each is the kind
   * of slip nobody notices later, so it is said at the moment it happens.
   */
  scope_note: string | null;
};

export type AuthorWarning = { level: "warn" | "alert"; text: string };

type StoredRow = {
  author: string;
  project: string | null;
  updated_at: string;
};

/** Every recorded session, newest check-in first. Only named callers have one. */
export function listSessions(db: Database): SessionRow[] {
  return db
    .query(
      `SELECT author, project, updated_at FROM session_state
       ORDER BY updated_at DESC, author ASC`,
    )
    .all() as StoredRow[];
}

/** One author's row, or null for a caller that gave no name. */
export function getSession(db: Database, author: string | null | undefined): SessionRow | null {
  const key = normalizeAuthor(author);
  if (!key) return null;
  return (db
    .query("SELECT project, author, updated_at FROM session_state WHERE author = ?")
    .get(key) as StoredRow | null) ?? null;
}

/**
 * Record a named session's check-in: where it checked in from and when. The
 * project is written as given, even when it is none, so a session is never
 * listed under a project it has left. The project only labels the session; it
 * never decides where a later command files anything.
 *
 * The row is keyed by author, so this cannot touch another agent's session. A
 * caller with no name has no row.
 */
export function setActive(
  db: Database,
  input: { project?: string | null; author?: string | null },
): SessionRow | null {
  const key = normalizeAuthor(input.author);
  if (!key) return null;
  const project = input.project?.trim() ? normalizeProject(input.project) : null;
  db.query(
    `INSERT INTO session_state (author, project, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(author) DO UPDATE SET project = excluded.project, updated_at = excluded.updated_at`,
  ).run(key, project, new Date().toISOString());
  return getSession(db, key);
}

export type BeginResult = {
  /** The row as it was before this call: the handoff watermark. */
  previous: SessionRow | null;
  current: SessionRow | null;
};

/**
 * Start a session: record the check-in, and report the row as it was first.
 * `previous` is the watermark "what happened since you were last here" is
 * measured against, and it only exists until the write below replaces it.
 * A caller that gave no name has no row, so no watermark, and writes nothing.
 */
export function beginSession(
  db: Database,
  input: {
    project?: string | null;
    author?: string | null;
    /** The repository the caller runs in. */
    cwdProject?: string | null;
  },
): BeginResult {
  // The name is whatever the caller declared — there is deliberately no
  // process.env fallback here. This runs inside the daemon, and the daemon is a
  // long-lived shared process whose environment belongs to whoever started it,
  // not to the caller.
  const author = normalizeAuthor(input.author);
  const declaredProject = input.project?.trim() ? normalizeProject(input.project) : null;
  const folderProject = input.cwdProject?.trim() ? normalizeProject(input.cwdProject) : null;
  const previous = getSession(db, author);
  return {
    previous,
    current: setActive(db, { project: declaredProject ?? folderProject, author }),
  };
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
 * Where a call's project and author come from. The project is what this call
 * declared (`--project`, or `OFFICE_PROJECT` folded in by the CLI), else the
 * repository the caller runs in, else none. The author is what this call
 * declared, else none. Nothing is taken from what the office remembers: you
 * can tell where a command files its work from where it ran.
 *
 * `OFFICE_PROJECT`/`OFFICE_AUTHOR` are resolved by the *caller*, never here.
 * This function runs inside the daemon — a long-lived, shared process — so its
 * environment belongs to whoever started it. A daemon started with
 * `OFFICE_AUTHOR=probe` would otherwise sign every unnamed write on the machine
 * with that name.
 */
export function resolveScope(
  db: Database,
  input: {
    project?: string | null;
    author?: string | null;
    cwdProject?: string | null;
    /** The caller's own project before this call wrote anything. Only `begin`
     *  passes it: by the time its briefing runs, the row already says the folder. */
    projectBefore?: string | null;
  } = {},
): Scope {
  const declaredProject = input.project?.trim() ? normalizeProject(input.project) : null;
  const cwdProject = input.cwdProject?.trim() ? normalizeProject(input.cwdProject) : null;
  const author = normalizeAuthor(input.author);
  const mine = getSession(db, author);

  const project = declaredProject ?? cwdProject ?? null;
  const projectSource: ScopeSource = declaredProject ? "declared" : cwdProject ? "folder" : "none";
  const before = input.projectBefore !== undefined ? input.projectBefore : (mine?.project ?? null);
  // A named project that is not the folder's own is said too: it may be a
  // leftover OFFICE_PROJECT in a launcher rather than a choice made now.
  const projectNote =
    projectSource === "folder" && author && before && before !== project
      ? `filed under ${project} (this folder); this session began on ${before}. ` +
        "One agent works in one repository — to work on that one, start a new agent there"
      : projectSource === "declared" && cwdProject && cwdProject !== project
        ? `filed under ${project}, as named by --project or OFFICE_PROJECT; this folder is ` +
          `${cwdProject}. One agent works in one repository — if that name is left over, unset it`
        : null;
  // A check-in hands out a numbered name; a bare one with no session behind it
  // signs this write as the tool, not the run.
  const authorNote =
    author && !mine && !INSTANCE_RE.test(author)
      ? `"${author}" is a name with no check-in behind it — did you mean the numbered ` +
        "name `office begin` gave you?"
      : null;
  return {
    project,
    author,
    project_source: projectSource,
    author_source: author ? "declared" : "none",
    active_since: mine && (mine.project ?? null) === project ? mine.updated_at : null,
    scope_note: [projectNote, authorNote].filter(Boolean).join(" · ") || null,
  };
}

/**
 * One-line startup banner confirming the active project and session within
 * the Agent Office framework.
 */
export function sessionBanner(scope: { project: string | null; author: string | null }): string {
  const who = scope.author ? ` as ${scope.author}` : "";
  if (scope.project) {
    const name = displayName(scope.project);
    return `Agent Office · working on ${name} (${scope.project})${who}`;
  }
  return `Agent Office · no project for this folder${who} (start the agent inside a project's repository, set one up with \`office init\`, or pass --project <path>)`;
}

/** What to say when a call gave no name: its writes are unsigned. */
export function authorWarnings(scope: Scope): AuthorWarning[] {
  if (scope.author) return [];
  return [
    {
      level: "warn",
      text: "no --by declared, so what you write is unsigned. Pass --by <agent> or export OFFICE_AUTHOR.",
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
  banner: string;
  project: string | null;
  project_source: ScopeSource;
  author: string | null;
  author_source: ScopeSource;
  active_since: string | null;
  scope_note: string | null;
  tools: Tool[];
  /**
   * Skills for every project, read from the checkout's `skills/` folder: name,
   * description, and the SKILL.md to read when a task matches. Skills marked
   * for other computers are counted in `skills_elsewhere`, not listed.
   */
  skills: Skill[];
  skills_elsewhere: number;
  /** SKILL.md files that could not be read; empty when all is well. */
  skills_problems: SkillProblem[];
  preferences: Memory[];
  open_work: WorkItem[];
  /** Why the open work above is the unclaimed set, when there was no project
   *  to scope it to. Null when it was scoped normally. */
  open_work_note: string | null;
  memories: Hit[];
  /**
   * This project's sessions seen in the last two weeks, newest first, at most
   * eight — plus the caller. The full list grew with every launch and was handed to every
   * agent on every check-in.
   */
  sessions: SessionSummary[];
  /** Sessions remembered but left out of the list above (other projects, or not seen lately). */
  sessions_hidden: number;
  /** Said when this check-in was given a numbered name, so the agent uses it. */
  identity_note: string | null;
  /**
   * Open issues about the office itself, most recently touched first, capped.
   * Shown to every session whatever its project, so a problem is added to
   * rather than filed twice. `issues_open` is the full count.
   */
  issues: Issue[];
  issues_open: number;
  /** Issues this author filed that someone else closed since their last visit. */
  issues_closed: Issue[];
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
    issues_open: number;
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
  // Kept for callers; the briefing's memories are a recent-first list, not a search.
  _embedder: Embedder | null,
  opts: {
    since?: string | null;
    /** What this call declared, so the briefing reports it rather than the
     *  fallback it happens to match. */
    declared?: { project?: string | null; author?: string | null };
    /** The repository the caller runs in, kept apart from `declared` so the
     *  briefing reports it as "folder", not as something the agent named. */
    cwdProject?: string | null;
    /** The caller's project before this check-in wrote anything. */
    projectBefore?: string | null;
    /** A visit that wrote nothing, so the notice watermark did not move. */
    readonly?: boolean;
    /** This check-in was given a new numbered name. */
    minted?: boolean;
    now?: number;
    /** Where the skills are read from; the checkout's folder by default. */
    skillsDir?: string;
  } = {},
): Promise<Briefing> {
  const skills = listSkills(opts.skillsDir ?? skillsDir());
  const scope = resolveScope(db, {
    ...opts.declared,
    cwdProject: opts.cwdProject,
    projectBefore: opts.projectBefore,
  });
  const readOnly = Boolean(opts.readonly);
  const watermark = opts.since?.trim() || null;
  // Memories that apply everywhere are handed over above, in `preferences`.
  // They are left out before the limit, not after it: filtered afterwards, a
  // run of newer everywhere-memories crowded every project's own memories out
  // of its briefing.
  const memories: Hit[] = listMemoriesInScope(db, BRIEFING_MEMORIES, scope.project, {
    excludeGlobal: true,
  }).map((memory, index) => ({
    ...memory,
    score: Number((1 / (index + 1)).toFixed(6)),
    similarity: null,
    via: "recent",
  }));
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
  // handed the project's recent activity instead, framed rather than implied.
  // With no project there is no activity to hand over: the briefing never
  // carries another project's details.
  const notices = !scope.project
    ? []
    : watermark
      ? recentEvents(db, {
          project: scope.project,
          since: watermark,
          excludeAuthor: scope.author,
          limit: BRIEFING_NOTICES,
        })
      : recentEvents(db, { project: scope.project, latest: true, limit: BRIEFING_NOTICES });
  const recentCutoff = new Date((opts.now ?? Date.now()) - SESSION_RECENT_DAYS * DAY_MS).toISOString();
  const allSessions = listSessions(db);
  // A fresh project that shares its git history with one whose folder is gone
  // may be that project, moved. Said, never acted on: notes only move when
  // someone runs `office move` (src/moves.ts).
  const movedFrom = !readOnly && scope.project ? likelyMovedFrom(db, scope.project) : [];
  const movedNote = movedFrom.length
    ? `this repository shares its git history with ${movedFrom.join(" and ")}, whose folder is gone. ` +
      "Tell the human; only if they say it was moved here, run `office move <old path>` " +
      "to bring its notes over, before writing anything here"
    : null;
  // Only this project's sessions: an agent on another project is not working
  // here, and the briefing never carries another project's details.
  const isYou = (session: SessionRow) => session.author !== null && session.author === scope.author;
  const shown = allSessions
    .filter((session) => isYou(session) || (scope.project !== null && session.project === scope.project))
    .filter((session, index) => isYou(session) || (session.updated_at >= recentCutoff && index < BRIEFING_SESSIONS));
  return {
    ok: true,
    banner: sessionBanner(scope),
    project: scope.project,
    project_source: scope.project_source,
    author: scope.author,
    author_source: scope.author_source,
    active_since: scope.active_since,
    // A project named in a folder that is not a repository holds for this call
    // only; nothing remembers it for the next one.
    scope_note:
      [
        scope.scope_note,
        scope.project_source === "declared" && !opts.cwdProject
          ? "this folder is not a git repository, so later commands here need --project too (or export OFFICE_PROJECT)"
          : null,
        movedNote,
      ]
        .filter(Boolean)
        .join(" · ") || null,
    tools: listTools(db),
    skills: skills.skills,
    skills_elsewhere: skills.elsewhere,
    skills_problems: skills.problems,
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
    issues: listIssues(db, { limit: BRIEFING_ISSUES }),
    issues_open: openIssueCount(db),
    issues_closed: closedSince(db, { author: scope.author, since: watermark }),
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
        : "nothing was written; you have no previous check-in of your own, so the activity above is this project's most recent rather than a since-you-were-last-here list, and it will read the same until you begin"
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
      issues_open: openIssueCount(db),
      tools: countTools(db),
      log_chars: logChars(db),
    },
    note,
  };
}
