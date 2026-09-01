import type { Database } from "bun:sqlite";
import { dumpTags, parseTags, type MemoryRow } from "./db";
import { dot, packing, unpacking, type Embedder } from "./embed";

export type Memory = {
  id: number;
  content: string;
  tags: string[];
  source: string | null;
  created_at: string;
};

export type Hit = Memory & { score: number };

const RRF_K = 60;

function publicMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    content: row.content,
    tags: parseTags(row.tags),
    source: row.source,
    created_at: row.created_at,
  };
}

export async function remember(
  db: Database,
  embedder: Embedder | null,
  input: { content: string; tags?: string[]; source?: string | null },
): Promise<Memory> {
  const content = input.content.trim();
  if (!content) throw new Error("empty memory");
  const tags = dumpTags(input.tags);
  const source = input.source?.trim() || null;
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
      `INSERT INTO memories (content, tags, source, created_at, embedding)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, content, tags, source, created_at`,
    )
    .get(content, tags, source, created_at, blob) as Omit<MemoryRow, "embedding">;
  return publicMemory({ ...row, embedding: null });
}

export function forget(db: Database, id: number): boolean {
  const result = db.query("DELETE FROM memories WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listMemories(db: Database, limit = 20): Memory[] {
  const rows = db
    .query(
      `SELECT id, content, tags, source, created_at
       FROM memories
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(Math.max(1, Math.min(limit, 100))) as Omit<MemoryRow, "embedding">[];
  return rows.map((row) => publicMemory({ ...row, embedding: null }));
}

export function countMemories(db: Database): number {
  const row = db.query("SELECT COUNT(*) AS n FROM memories").get() as { n: number };
  return row.n;
}

function ftsQuery(raw: string): string | null {
  const tokens = raw
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
  if (!tokens.length) return null;
  return tokens.map((t) => `"${t}"`).join(" OR ");
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

function vectorRank(
  db: Database,
  queryVec: Float32Array,
  limit: number,
): number[] {
  const rows = db
    .query("SELECT id, embedding FROM memories WHERE embedding IS NOT NULL")
    .all() as { id: number; embedding: Uint8Array }[];
  const scored: { id: number; score: number }[] = [];
  for (const row of rows) {
    const vec = unpacking(row.embedding);
    if (!vec) continue;
    scored.push({ id: row.id, score: dot(queryVec, vec) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.id);
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

function loadByIds(db: Database, ids: number[]): MemoryRow[] {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(",");
  return db
    .query(
      `SELECT id, content, tags, source, created_at
       FROM memories
       WHERE id IN (${placeholders})`,
    )
    .all(...ids) as Omit<MemoryRow, "embedding">[] as MemoryRow[];
}

export async function search(
  db: Database,
  embedder: Embedder | null,
  query: string,
  limit = 8,
): Promise<Hit[]> {
  const q = query.trim();
  const cap = Math.max(1, Math.min(limit, 50));
  if (!q) {
    return listMemories(db, cap).map((m, index) => ({
      ...m,
      score: 1 / (index + 1),
    }));
  }

  const fts = ftsRank(db, q, cap * 3);
  let vec: number[] = [];
  if (embedder) {
    try {
      const encoded = await embedder.encode(q);
      if (encoded) vec = vectorRank(db, encoded, cap * 3);
    } catch {
      vec = [];
    }
  }

  const scores = rrf([fts, vec].filter((r) => r.length));
  if (!scores.size) return [];

  const ordered = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, cap);
  const rows = loadByIds(db, ordered.map(([id]) => id));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const hits: Hit[] = [];
  for (const [id, score] of ordered) {
    const row = byId.get(id);
    if (!row) continue;
    hits.push({ ...publicMemory(row), score: Number(score.toFixed(6)) });
  }
  return hits;
}

export async function context(
  db: Database,
  embedder: Embedder | null,
  query: string,
  limit = 8,
): Promise<Hit[]> {
  const q = query.trim();
  if (!q) return search(db, embedder, "", limit);
  return search(db, embedder, q, limit);
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
