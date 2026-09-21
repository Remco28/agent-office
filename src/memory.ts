import type { Database } from "bun:sqlite";
import { dumpTags, parseTags, SCOPE_GLOBAL, SCOPE_PROJECT, type MemoryRow } from "./db";
import { dot, packing, unpacking, type Embedder } from "./embed";
import { minSimilarity } from "./paths";
import { matchingProjects, normalizeProject, scopeClause } from "./scope";

export type Memory = {
  id: number;
  content: string;
  tags: string[];
  project: string | null;
  author: string | null;
  scope: string;
  created_at: string;
};

export type Hit = Memory & {
  /** Rank fusion only — useful for ordering, meaningless as confidence. */
  score: number;
  /** Cosine similarity, or null when no embedding was available. */
  similarity: number | null;
  via: "fts" | "vector" | "fts+vector" | "recent";
};

export type SearchResult = {
  hits: Hit[];
  searched: number;
  floor: number;
  project: string | null;
  scope: "project" | "all";
};

export type SearchOptions = {
  project?: string | null;
  minSimilarity?: number;
};

const RRF_K = 60;
const COLUMNS = "id, content, tags, project, author, scope, created_at";

/**
 * Function words carry no retrieval signal, and leaving them in makes a
 * meaningless question ("the and for") match half the store. Dropping them is
 * what lets an empty result mean "nothing here" instead of "eight near-misses".
 */
const STOPWORDS = new Set(
  `a about after all also an and any are as at be because been before being but by can
   could did do does doing for from had has have having he her here hers him his how i if
   in into is it its just me might more most must my no nor not of on or our ours out over
   own she should so some such than that the their theirs them then there these they this
   those to too under up us very was we were what when where which while who whom why will
   with would you your yours`
    .split(/\s+/)
    .filter(Boolean),
);

function publicMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    content: row.content,
    tags: parseTags(row.tags),
    project: row.project,
    author: row.author,
    scope: row.scope,
    created_at: row.created_at,
  };
}

/** The `WHERE` fragment for a scope, or nothing when the project is unknown. */
function scopeFragment(
  db: Database,
  project: string | null | undefined,
): { sql: string; params: string[] } {
  if (!project) return { sql: "", params: [] };
  return scopeClause(matchingProjects(db, project));
}

function scopedIds(db: Database, project: string | null | undefined): Set<number> | null {
  if (!project) return null;
  const { sql, params } = scopeFragment(db, project);
  const rows = db
    .query(`SELECT id FROM memories WHERE 1=1${sql}`)
    .all(...params) as { id: number }[];
  return new Set(rows.map((row) => row.id));
}

function loadByIds(db: Database, ids: number[]): MemoryRow[] {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(",");
  return db
    .query(`SELECT ${COLUMNS} FROM memories WHERE id IN (${placeholders})`)
    .all(...ids) as MemoryRow[];
}

export async function remember(
  db: Database,
  embedder: Embedder | null,
  input: {
    content: string;
    tags?: string[];
    project?: string | null;
    author?: string | null;
    scope?: string | null;
    /** Legacy alias for `project`; the old CLI flag wrote this. */
    source?: string | null;
  },
): Promise<Memory> {
  const content = input.content.trim();
  if (!content) throw new Error("empty memory");
  const tags = dumpTags(input.tags);
  const scope = input.scope === SCOPE_GLOBAL ? SCOPE_GLOBAL : SCOPE_PROJECT;
  const rawProject = input.project ?? input.source ?? null;
  const project = rawProject?.trim() ? normalizeProject(rawProject) : null;
  const author = input.author?.trim() || null;
  const created_at = new Date().toISOString();
  let blob: Buffer | null = null;
  if (embedder) {
    try {
      const vector = await embedder.encode(content);
      if (vector) blob = packing(vector);
    } catch {
      blob = null;
    }
  }
  const row = db
    .query(
      `INSERT INTO memories (content, tags, project, author, scope, created_at, embedding)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING ${COLUMNS}`,
    )
    .get(content, tags, project, author, scope, created_at, blob) as MemoryRow;
  return publicMemory(row);
}

export function forget(db: Database, id: number): boolean {
  const result = db.query("DELETE FROM memories WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listMemories(db: Database, limit = 20, project?: string | null): Memory[] {
  const { sql, params } = scopeFragment(db, project);
  const rows = db
    .query(
      `SELECT ${COLUMNS} FROM memories
       WHERE 1=1${sql}
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(...params, Math.max(1, Math.min(limit, 200))) as MemoryRow[];
  return rows.map(publicMemory);
}

export function listGlobalMemories(db: Database, limit = 20): Memory[] {
  const rows = db
    .query(
      `SELECT ${COLUMNS} FROM memories
       WHERE scope = '${SCOPE_GLOBAL}'
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(Math.max(1, Math.min(limit, 100))) as MemoryRow[];
  return rows.map(publicMemory);
}

export function countMemories(db: Database): number {
  const row = db.query("SELECT COUNT(*) AS n FROM memories").get() as { n: number };
  return row.n;
}

/** Project notes with nothing saying which project — stored, but unfindable by scope. */
export function countUnattributed(db: Database): number {
  const row = db
    .query(
      `SELECT COUNT(*) AS n FROM memories
       WHERE scope = '${SCOPE_PROJECT}' AND project IS NULL`,
    )
    .get() as { n: number };
  return row.n;
}

export function countInScope(db: Database, project: string | null | undefined): number {
  const { sql, params } = scopeFragment(db, project);
  const row = db
    .query(`SELECT COUNT(*) AS n FROM memories WHERE 1=1${sql}`)
    .get(...params) as { n: number };
  return row.n;
}

function ftsQuery(raw: string): string | null {
  const tokens = raw
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  if (!tokens.length) return null;
  return [...new Set(tokens)].map((t) => `"${t}"`).join(" OR ");
}

function ftsRank(db: Database, query: string, limit: number): number[] {
  const match = ftsQuery(query);
  if (!match) return [];
  try {
    const rows = db
      .query(
        `SELECT rowid AS id
         FROM memories_fts
         WHERE memories_fts MATCH ?
         ORDER BY rank
         LIMIT ?`,
      )
      .all(match, limit) as { id: number }[];
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

/** Similarity for every embedded memory, plus the best ones in order. */
function vectorRank(
  db: Database,
  queryVec: Float32Array,
  limit: number,
): { ranked: number[]; sims: Map<number, number> } {
  const rows = db
    .query("SELECT id, embedding FROM memories WHERE embedding IS NOT NULL")
    .all() as { id: number; embedding: Uint8Array }[];
  const sims = new Map<number, number>();
  const scored: { id: number; score: number }[] = [];
  for (const row of rows) {
    const vec = unpacking(row.embedding);
    if (!vec) continue;
    const score = dot(queryVec, vec);
    sims.set(row.id, score);
    scored.push({ id: row.id, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return { ranked: scored.slice(0, limit).map((s) => s.id), sims };
}

function rrf(rankings: number[][]): Map<number, number> {
  const scores = new Map<number, number>();
  for (const ranking of rankings) {
    ranking.forEach((id, index) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (RRF_K + index + 1));
    });
  }
  return scores;
}

/**
 * What to show for this question, given everything known about scope.
 *
 * Two things are filters, not scores. Word matches are kept on their own
 * evidence — an exact term is a real signal regardless of vectors. Meaning-only
 * hits must clear the similarity floor, so a question with no answer returns
 * nothing rather than a page of weak matches.
 */
export async function searchDetailed(
  db: Database,
  embedder: Embedder | null,
  query: string,
  limit = 8,
  opts: SearchOptions = {},
): Promise<SearchResult> {
  const q = query.trim();
  const cap = Math.max(1, Math.min(limit, 50));
  const project = opts.project ? normalizeProject(opts.project) : null;
  const floor = opts.minSimilarity ?? minSimilarity();
  const allowed = scopedIds(db, project);
  const searched = allowed ? allowed.size : countMemories(db);
  const base = { searched, floor, project, scope: project ? "project" : "all" } as const;

  if (!q) {
    const recent = listMemories(db, cap, project);
    return {
      ...base,
      hits: recent.map((memory, index) => ({
        ...memory,
        score: Number((1 / (index + 1)).toFixed(6)),
        similarity: null,
        via: "recent",
      })),
    };
  }

  const fts = ftsRank(db, q, cap * 3).filter((id) => !allowed || allowed.has(id));
  let vec: number[] = [];
  let sims = new Map<number, number>();
  if (embedder) {
    try {
      const encoded = await embedder.encode(q);
      if (encoded) {
        const ranked = vectorRank(db, encoded, cap * 3);
        sims = ranked.sims;
        vec = ranked.ranked.filter((id) => !allowed || allowed.has(id));
      }
    } catch {
      vec = [];
    }
  }

  // Two kinds of evidence, each judged on its own: a word that is really in
  // the text, and a meaning that clears the floor. A memory that merely ranks
  // low in the vector list has not been endorsed by the vector, so it must
  // only reach the output through the other evidence.
  const meaning = new Set<number>();
  for (const id of vec) {
    const similarity = sims.get(id);
    if (similarity != null && similarity >= floor) meaning.add(id);
  }
  const keptVec = vec.filter((id) => meaning.has(id));
  const scores = rrf([fts, keptVec].filter((ranking) => ranking.length));
  if (!scores.size) return { ...base, hits: [] };

  const ordered = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, cap);
  const rows = loadByIds(db, ordered.map(([id]) => id));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const hits: Hit[] = [];
  for (const [id, score] of ordered) {
    const row = byId.get(id);
    if (!row) continue;
    const word = fts.includes(id);
    const meaningHit = meaning.has(id);
    const similarity = sims.get(id);
    hits.push({
      ...publicMemory(row),
      score: Number(score.toFixed(6)),
      similarity: similarity == null ? null : Number(similarity.toFixed(4)),
      via: word && meaningHit ? "fts+vector" : word ? "fts" : "vector",
    });
  }
  return { ...base, hits };
}

export async function search(
  db: Database,
  embedder: Embedder | null,
  query: string,
  limit = 8,
  opts: SearchOptions = {},
): Promise<Hit[]> {
  return (await searchDetailed(db, embedder, query, limit, opts)).hits;
}

/** A briefing is a search for "what should I know for this?" */
export async function context(
  db: Database,
  embedder: Embedder | null,
  query: string,
  limit = 8,
  opts: SearchOptions = {},
): Promise<Hit[]> {
  return (await searchDetailed(db, embedder, query, limit, opts)).hits;
}

export async function backfillEmbeddings(
  db: Database,
  embedder: Embedder,
  max = 50,
): Promise<number> {
  if (!embedder.ready) return 0;
  const rows = db
    .query(
      `SELECT id, content FROM memories
       WHERE embedding IS NULL
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(max) as { id: number; content: string }[];
  let filled = 0;
  for (const row of rows) {
    const vector = await embedder.encode(row.content);
    if (!vector) continue;
    db.query("UPDATE memories SET embedding = ? WHERE id = ?").run(
      packing(vector),
      row.id,
    );
    filled += 1;
  }
  return filled;
}
