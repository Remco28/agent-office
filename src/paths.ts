import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

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

/**
 * Where a detached daemon's output goes. Its stdio is pointed here for one
 * reason: when the embedder cannot start, that file is the only place the
 * reason is ever written down.
 */
export function logPath(): string {
  return join(dataDir(), "office.log");
}

/**
 * The interpreter `install.sh` last verified, recorded under the data dir.
 * Machine state belongs there rather than in the checkout: the venv may live
 * outside the repo, and OFFICE_PYTHON only reaches a process that was started
 * with it in the environment.
 */
export function recordedPythonPath(): string {
  return join(dataDir(), "python");
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

/**
 * Interpreters to try, best first: what the machine declares, then the venv
 * `install.sh` builds, then whatever it recorded, then plain `python3`.
 *
 * This list used to carry a hardcoded `~/callum/.venv` -- the home directory of
 * the machine this was first set up on. A path that exists on exactly one
 * computer is the one candidate that can never help a new one, so it is gone.
 */
export function pythonCandidates(): string[] {
  let recorded: string | null = null;
  try {
    recorded = readFileSync(recordedPythonPath(), "utf8").trim() || null;
  } catch {
    recorded = null;
  }
  // The record outranks the checkout's own venv: it is the interpreter an
  // install actually verified on this machine, which is what lets the venv live
  // outside the repo (and survive a `git clean -xfd`) without an env var.
  return [
    process.env.OFFICE_PYTHON,
    recorded,
    join(ROOT, ".venv", "bin", "python3"),
    "python3",
  ].filter((candidate): candidate is string => Boolean(candidate));
}

export function detectPython(): string {
  for (const candidate of pythonCandidates()) {
    if (candidate === "python3" || existsSync(candidate)) return candidate;
  }
  return "python3";
}
