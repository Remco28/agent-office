import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";

export const ROOT = join(import.meta.dir, "..");
export const SIDECAR = join(ROOT, "sidecar", "embed.py");
export const MODEL_NAME = process.env.OFFICE_MODEL ?? "all-MiniLM-L6-v2";

export function dataDir(): string {
  if (process.env.OFFICE_HOME) return process.env.OFFICE_HOME;
  return join(homedir(), ".local", "share", "agent-office");
}

export function dbPath(): string {
  return process.env.OFFICE_DB ?? join(dataDir(), "memory.db");
}

export function pidPath(): string {
  return join(dataDir(), "office.pid");
}

export function port(): number {
  const raw = process.env.OFFICE_PORT;
  const n = raw ? Number(raw) : 7701;
  if (!Number.isInteger(n) || n <= 0) throw new Error(`bad OFFICE_PORT: ${raw}`);
  return n;
}

export function baseUrl(): string {
  return `http://127.0.0.1:${port()}`;
}

/** Characters of work trail to keep before pruning the oldest closed work. */
export function logCap(): number {
  const raw = process.env.OFFICE_LOG_CAP;
  const n = raw ? Number(raw) : 1_000_000;
  return Number.isFinite(n) && n > 0 ? n : 1_000_000;
}

/**
 * Cosine similarity a memory needs before it is worth showing. Word matches
 * are always kept; this only screens the meaning-only hits, which is what
 * stops an unrelated question returning a page of near-miss notes.
 */
export function minSimilarity(): number {
  const raw = process.env.OFFICE_MIN_SIM;
  const n = raw ? Number(raw) : 0.3;
  if (!Number.isFinite(n)) return 0.3;
  return Math.max(0, Math.min(n, 1));
}

export function detectPython(): string {
  const candidates = [
    process.env.OFFICE_PYTHON,
    join(ROOT, ".venv", "bin", "python3"),
    join(homedir(), "callum", ".venv", "bin", "python3"),
    "python3",
  ].filter((x): x is string => Boolean(x));

  for (const candidate of candidates) {
    if (candidate === "python3" || existsSync(candidate)) return candidate;
  }
  return "python3";
}
