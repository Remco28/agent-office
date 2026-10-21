import { clampLimit } from "./db";
import { dot, type Embedder } from "./embed";
import { queryTokens } from "./memory";
import { minSimilarity } from "./paths";
import { listSkills, type Skill } from "./skills";

export type SkillHit = Skill & {
  kind: "skill";
  /** Rank fusion, for ordering rather than confidence. */
  score: number;
  similarity: number | null;
  via: "words" | "vector" | "words+vector";
};

/**
 * The files remain the source of truth. Re-read metadata on each search; only
 * cache derived vectors in this daemon, keyed by path and current text. No
 * skills or embeddings are written to the memory store.
 */
export function createSkillSearch(embedder: Embedder | null) {
  const vectors = new Map<string, { text: string; vector: Float32Array }>();
  return async (dir: string, query: string, limit = 8) => {
    const listing = listSkills(dir);
    const paths = new Set(listing.skills.map((skill) => skill.path));
    for (const path of vectors.keys()) if (!paths.has(path)) vectors.delete(path);
    const base = {
      skills_searched: listing.skills.length,
      skills_problems: listing.problems,
    };
    const tokens = queryTokens(query);
    // An empty context is the recent-memory view, not every available skill.
    if (!tokens.length || !listing.skills.length) return { ...base, skill_hits: [] as SkillHit[] };

    let encoded: Float32Array | null = null;
    if (embedder?.ready) {
      try { encoded = await embedder.encode(query); } catch { /* Word search still works. */ }
    }
    const candidates = [];
    for (const skill of listing.skills) {
      const text = `${skill.name}\n${skill.description}`;
      const name = new Set(queryTokens(skill.name));
      const words = new Set(queryTokens(text));
      const wordScore = tokens.reduce((sum, token) => sum + (words.has(token) ? 1 : 0) + (name.has(token) ? 1 : 0), 0);
      let similarity: number | null = null;
      const cached = vectors.get(skill.path);
      if (cached && cached.text !== text) vectors.delete(skill.path);
      if (encoded && embedder) {
        let vector = cached?.text === text ? cached.vector : null;
        if (!vector || vector.length !== encoded.length) {
          try { vector = await embedder.encode(text); } catch { vector = null; }
          if (vector) vectors.set(skill.path, { text, vector });
        }
        if (vector?.length === encoded.length) similarity = dot(encoded, vector);
      }
      candidates.push({ skill, wordScore, similarity });
    }
    const words = candidates.filter((c) => c.wordScore > 0).sort((a, b) => b.wordScore - a.wordScore);
    const meaning = candidates.filter((c) => c.similarity !== null && c.similarity >= minSimilarity())
      .sort((a, b) => b.similarity! - a.similarity!);
    const scores = new Map<string, number>();
    for (const ranking of [words, meaning]) ranking.forEach((c, i) => {
      scores.set(c.skill.path, (scores.get(c.skill.path) ?? 0) + 1 / (61 + i));
    });
    const semanticPaths = new Set(meaning.map((c) => c.skill.path));
    const skill_hits: SkillHit[] = candidates.filter((c) => scores.has(c.skill.path)).map((c) => ({
      ...c.skill,
      kind: "skill" as const,
      score: Number(scores.get(c.skill.path)!.toFixed(6)),
      similarity: c.similarity === null ? null : Number(c.similarity.toFixed(4)),
      via: c.wordScore > 0 ? (semanticPaths.has(c.skill.path) ? "words+vector" : "words") : "vector",
    }));
    skill_hits.sort((a, b) => b.score - a.score);
    return { ...base, skill_hits: skill_hits.slice(0, clampLimit(limit, 8, 50)) };
  };
}
