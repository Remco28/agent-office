import type { Database } from "bun:sqlite";
import type { ToolRow } from "./db";

export type Tool = {
  name: string;
  summary: string;
  usage: string | null;
  notes: string | null;
  updated_at: string;
};

type RawTool = Omit<ToolRow, "id" | "created_at">;

function toTool(row: RawTool): Tool {
  return {
    name: row.name,
    summary: row.summary,
    usage: row.usage,
    notes: row.notes,
    updated_at: row.updated_at,
  };
}

export function listTools(db: Database): Tool[] {
  const rows = db
    .query(
      `SELECT name, summary, usage, notes, updated_at FROM tools
       ORDER BY name ASC`,
    )
    .all() as RawTool[];
  return rows.map(toTool);
}

export function getTool(db: Database, name: string): Tool | null {
  const row = db
    .query(
      `SELECT name, summary, usage, notes, updated_at FROM tools WHERE name = ?`,
    )
    .get(normalizeName(name)) as RawTool | null;
  return row ? toTool(row) : null;
}

export function normalizeName(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Add or refresh a tool. Running this again for an existing name is how the
 * list stays current: the office is updated once and every later session sees
 * the new description. Omitted `usage` / `notes` keep their previous value.
 */
export function upsertTool(
  db: Database,
  input: { name: string; summary: string; usage?: string | null; notes?: string | null },
): Tool {
  const name = normalizeName(input.name);
  if (!name) throw new Error("tool needs a name");
  const summary = input.summary.trim();
  if (!summary) throw new Error("tool needs a summary");
  const now = new Date().toISOString();
  const row = db
    .query(
      `INSERT INTO tools (name, summary, usage, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET
         summary = excluded.summary,
         usage = COALESCE(excluded.usage, tools.usage),
         notes = COALESCE(excluded.notes, tools.notes),
         updated_at = excluded.updated_at
       RETURNING name, summary, usage, notes, updated_at`,
    )
    .get(
      name,
      summary,
      input.usage?.trim() || null,
      input.notes?.trim() || null,
      now,
      now,
    ) as RawTool;
  return toTool(row);
}

export function removeTool(db: Database, name: string): boolean {
  const result = db.query("DELETE FROM tools WHERE name = ?").run(normalizeName(name));
  return result.changes > 0;
}

export function countTools(db: Database): number {
  const row = db.query("SELECT COUNT(*) AS n FROM tools").get() as { n: number };
  return row.n;
}
