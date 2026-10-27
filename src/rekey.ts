import type { Database } from "bun:sqlite";
import { normalizeProject } from "./scope";

/** Every table that files a record under a project. */
const TABLES = ["memories", "work", "issues", "session_state"] as const;
const MARKER = "project_keys_v1";

export type RekeyResult = {
  /** Old key -> new key, for every key that was rewritten. */
  renamed: Record<string, string>;
  /** Keys left as they were because there is nothing to resolve them against. */
  unmapped: string[];
};

/**
 * Rewrite stored project keys to the key a write would store today, once.
 *
 * Reads match keys exactly, so a record filed under an older spelling — a plain
 * name from before keys were folders (`fencing-team-draft-game`), a subfolder of
 * a repository, a link to one — would otherwise never be found again. Each
 * stored value becomes `normalizeProject(value)`: a plain name with a folder of
 * that name in ~/Projects becomes that folder's project, and a path inside a
 * repository becomes the repository. A value that resolves to nothing new (a
 * folder that was moved or removed, a name with no folder) is left as it was and
 * reported, never guessed.
 *
 * The full pass runs once per database (a marker row records it). Later starts
 * look again only at plain names, which cost no git call to skip, so an old name
 * is still mapped once its folder appears. All of it is one transaction: a
 * failure leaves every key as it was.
 */
export function canonicalizeProjects(db: Database): RekeyResult {
  db.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT)");
  const done = db.query("SELECT 1 FROM meta WHERE key = ?").get(MARKER) !== null;
  const values = new Set<string>();
  for (const table of TABLES) {
    const rows = db
      .query(`SELECT DISTINCT project AS p FROM ${table} WHERE project IS NOT NULL`)
      .all() as { p: unknown }[];
    // Only text is a key; anything else written by hand is left alone rather
    // than allowed to stop every other key's rename.
    for (const row of rows) {
      if (typeof row.p === "string" && (!done || !row.p.includes("/"))) values.add(row.p);
    }
  }
  const renamed: Record<string, string> = {};
  const unmapped: string[] = [];
  for (const value of values) {
    const key = normalizeProject(value);
    if (key && key !== value) renamed[value] = key;
    else if (!value.includes("/")) unmapped.push(value);
  }
  db.transaction(() => {
    for (const [from, to] of Object.entries(renamed)) {
      for (const table of TABLES) {
        db.query(`UPDATE ${table} SET project = ? WHERE project = ?`).run(to, from);
      }
    }
    db.query("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(MARKER, new Date().toISOString());
  })();
  return { renamed, unmapped };
}
