import type { Database } from "bun:sqlite";
import { SCOPE_GLOBAL, type SessionRow } from "./db";
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
import { listWork, logChars, openWorkCount, workCount, type WorkItem } from "./work";
import { countTools, listTools, type Tool } from "./tools";

export const BRIEFING_MEMORIES = 6;
export const BRIEFING_WORK = 10;
export const BRIEFING_PREFERENCES = 12;

export type ScopeSource = "declared" | "active" | "none";

export type Scope = {
  project: string | null;
  author: string | null;
  project_source: ScopeSource;
  author_source: ScopeSource;
  active_since: string | null;
};

export function getActive(db: Database): SessionRow | null {
  const row = db
    .query("SELECT project, author, updated_at FROM session_state WHERE id = 1")
    .get() as SessionRow | null;
  return row ?? null;
}

/**
 * Record what this session is working on. Called by `office begin`, which is
 * the one moment a CLI is asked to name its target — every later write
 * inherits it, and a write that cannot resolve a project is stored
 * unattributed rather than guessed.
 */
export function setActive(
  db: Database,
  input: { project?: string | null; author?: string | null },
): SessionRow | null {
  const project = input.project?.trim() ? normalizeProject(input.project) : null;
  const author = input.author?.trim() || null;
  db.query(
    `INSERT INTO session_state (id, project, author, updated_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       project = excluded.project,
       author = excluded.author,
       updated_at = excluded.updated_at`,
  ).run(project, author, new Date().toISOString());
  return getActive(db);
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
 * then what the machine declares, then what the office still remembers.
 * Nothing is inferred from the working directory — agents are started in the
 * office itself and name their target out loud.
 */
export function resolveScope(
  db: Database,
  input: { project?: string | null; author?: string | null } = {},
): Scope {
  const active = getActive(db);
  const declaredProject = input.project?.trim() ? normalizeProject(input.project) : envProject();
  const declaredAuthor = input.author?.trim() || envAuthor();

  const project = declaredProject ?? active?.project ?? null;
  const author = declaredAuthor ?? active?.author ?? null;
  return {
    project,
    author,
    project_source: declaredProject ? "declared" : active?.project ? "active" : "none",
    author_source: declaredAuthor ? "declared" : active?.author ? "active" : "none",
    active_since: active?.updated_at ?? null,
  };
}

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
 */
export async function briefing(
  db: Database,
  embedder: Embedder | null,
): Promise<Briefing> {
  const scope = resolveScope(db);
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
