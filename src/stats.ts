import { existsSync, statSync } from "node:fs";
import { Database } from "bun:sqlite";
import { dbPath, logCap } from "./paths";

export const WARN_BYTES = 50 * 1024 * 1024;
export const ALERT_BYTES = 200 * 1024 * 1024;
export const WARN_COUNT = 2_000;
export const ALERT_COUNT = 10_000;
export const WARN_HOUR = 80;
export const ALERT_HOUR = 300;
export const WARN_WAL = 8 * 1024 * 1024;
export const WARN_MAX_CHARS = 20_000;
export const WARN_OPEN_WORK = 20;
export const ALERT_OPEN_WORK = 75;

export type Warning = { level: "warn" | "alert"; text: string };

export type StoreStats = {
  path: string;
  exists: boolean;
  bytes: number;
  walBytes: number;
  shmBytes: number;
  totalBytes: number;
  memories: number | null;
  missingEmbeddings: number | null;
  lastWrite: string | null;
  lastHour: number | null;
  lastDay: number | null;
  maxChars: number | null;
  unattributed: number | null;
  workOpen: number | null;
  workTotal: number | null;
  logChars: number | null;
  tools: number | null;
};

export type DeskSnapshot = {
  daemon: {
    up: boolean;
    port: number;
    pid: number | null;
    startedAt: string | null;
  };
  embedder: "ready" | "loading" | "stuck" | "down";
  model: string | null;
  /** The project the office thinks this session is working on. */
  active: { project: string | null; author: string | null; since: string | null } | null;
  /** Every session the office remembers. `active` is null once there are two. */
  sessions: Array<{ project: string | null; author: string | null; since: string | null }>;
  store: StoreStats;
  warnings: Warning[];
};

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return "never";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return iso;
  const sec = Math.max(0, Math.round((now - then) / 1000));
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return `${days}d ago`;
}

function fileSize(path: string): number {
  try {
    if (!existsSync(path)) return 0;
    return statSync(path).size;
  } catch {
    return 0;
  }
}

export function fileStats(path = dbPath()): Pick<
  StoreStats,
  "path" | "exists" | "bytes" | "walBytes" | "shmBytes" | "totalBytes"
> {
  const bytes = fileSize(path);
  const walBytes = fileSize(`${path}-wal`);
  const shmBytes = fileSize(`${path}-shm`);
  return {
    path,
    exists: existsSync(path),
    bytes,
    walBytes,
    shmBytes,
    totalBytes: bytes + walBytes + shmBytes,
  };
}

/** Like a count query, but a store written by an older version scores null. */
function countOr(db: Database, sql: string): number | null {
  try {
    return (db.query(sql).get() as { n: number }).n;
  } catch {
    return null;
  }
}

export function queryStore(db: Database, now = new Date()): Omit<
  StoreStats,
  "path" | "exists" | "bytes" | "walBytes" | "shmBytes" | "totalBytes"
> {
  const hour = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const day = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const memories = (db.query("SELECT COUNT(*) AS n FROM memories").get() as { n: number }).n;
  const missingEmbeddings = (
    db.query("SELECT COUNT(*) AS n FROM memories WHERE embedding IS NULL").get() as { n: number }
  ).n;
  const lastWrite =
    (db.query("SELECT MAX(created_at) AS t FROM memories").get() as { t: string | null }).t ??
    null;
  const lastHour = (
    db.query("SELECT COUNT(*) AS n FROM memories WHERE created_at >= ?").get(hour) as { n: number }
  ).n;
  const lastDay = (
    db.query("SELECT COUNT(*) AS n FROM memories WHERE created_at >= ?").get(day) as { n: number }
  ).n;
  const maxChars = (
    db.query("SELECT MAX(LENGTH(content)) AS n FROM memories").get() as { n: number | null }
  ).n;
  return {
    memories,
    missingEmbeddings,
    lastWrite,
    lastHour,
    lastDay,
    maxChars,
    unattributed: countOr(
      db,
      "SELECT COUNT(*) AS n FROM memories WHERE scope = 'project' AND project IS NULL",
    ),
    workOpen: countOr(
      db,
      `SELECT COUNT(*) AS n FROM work w WHERE NOT EXISTS (
         SELECT 1 FROM work_events e WHERE e.work_id = w.id AND e.kind = 'close')`,
    ),
    workTotal: countOr(db, "SELECT COUNT(*) AS n FROM work"),
    logChars: countOr(
      db,
      `SELECT (SELECT COALESCE(SUM(LENGTH(title)), 0) FROM work) +
              (SELECT COALESCE(SUM(LENGTH(text)), 0) FROM work_events) AS n`,
    ),
    tools: countOr(db, "SELECT COUNT(*) AS n FROM tools"),
  };
}

export function collectStoreStats(path = dbPath(), now = new Date()): StoreStats {
  const files = fileStats(path);
  if (!files.exists) {
    return {
      ...files,
      memories: 0,
      missingEmbeddings: 0,
      lastWrite: null,
      lastHour: 0,
      lastDay: 0,
      maxChars: 0,
      unattributed: 0,
      workOpen: 0,
      workTotal: 0,
      logChars: 0,
      tools: 0,
    };
  }
  let queried: ReturnType<typeof queryStore> | null = null;
  try {
    const db = new Database(path, { readonly: true });
    try {
      queried = queryStore(db, now);
    } finally {
      db.close();
    }
  } catch {
    queried = {
      memories: null,
      missingEmbeddings: null,
      lastWrite: null,
      lastHour: null,
      lastDay: null,
      maxChars: null,
      unattributed: null,
      workOpen: null,
      workTotal: null,
      logChars: null,
      tools: null,
    };
  }
  return { ...files, ...queried };
}

export function warningsFor(input: {
  daemonUp: boolean;
  embedder: DeskSnapshot["embedder"];
  store: StoreStats;
}): Warning[] {
  const out: Warning[] = [];
  const { store } = input;
  if (!input.daemonUp) {
    out.push({ level: "warn", text: "memory daemon is down — agents cannot remember or search" });
  }
  if (input.embedder === "stuck") {
    out.push({
      level: "alert",
      text: "embedder did not become ready — MiniLM may be missing or the sidecar died",
    });
  } else if (input.daemonUp && input.embedder === "loading") {
    out.push({ level: "warn", text: "embedder still loading — search is FTS-only until it is ready" });
  } else if (input.embedder === "down" && input.daemonUp) {
    out.push({ level: "alert", text: "embedder is down while the daemon is up" });
  }

  if (store.totalBytes >= ALERT_BYTES) {
    out.push({
      level: "alert",
      text: `database is ${formatBytes(store.totalBytes)} — far past a healthy filing cabinet`,
    });
  } else if (store.totalBytes >= WARN_BYTES) {
    out.push({
      level: "warn",
      text: `database is ${formatBytes(store.totalBytes)} — check an agent is not dumping junk`,
    });
  }

  if (store.walBytes >= WARN_WAL) {
    out.push({
      level: "warn",
      text: `WAL is ${formatBytes(store.walBytes)} — checkpoint to fold it back in`,
    });
  }

  if (store.memories != null && store.memories >= ALERT_COUNT) {
    out.push({ level: "alert", text: `${store.memories} memories — this looks runaway` });
  } else if (store.memories != null && store.memories >= WARN_COUNT) {
    out.push({
      level: "warn",
      text: `${store.memories} memories — more than a curated store should hold`,
    });
  }

  if (store.lastHour != null && store.lastHour >= ALERT_HOUR) {
    out.push({
      level: "alert",
      text: `${store.lastHour} writes in the last hour — an agent may be looping`,
    });
  } else if (store.lastHour != null && store.lastHour >= WARN_HOUR) {
    out.push({ level: "warn", text: `${store.lastHour} writes in the last hour` });
  }

  if (store.maxChars != null && store.maxChars >= WARN_MAX_CHARS) {
    out.push({
      level: "warn",
      text: `a memory is ${store.maxChars.toLocaleString()} chars — source dumps do not belong here`,
    });
  }

  // Open work is the handoff, so it is never pruned. It is also the one thing
  // that goes stale silently, so it gets a health signal of its own.
  if (store.workOpen != null && store.workOpen >= ALERT_OPEN_WORK) {
    out.push({
      level: "alert",
      text: `${store.workOpen} pieces of work are open — the trail is not being closed`,
    });
  } else if (store.workOpen != null && store.workOpen >= WARN_OPEN_WORK) {
    out.push({
      level: "warn",
      text: `${store.workOpen} pieces of work are open — close the ones that are done`,
    });
  }

  if (store.logChars != null && store.logChars >= logCap() * 0.9) {
    out.push({
      level: "warn",
      text: "the work log is at its size cap — oldest closed work is being dropped",
    });
  }

  if (
    store.memories != null &&
    store.missingEmbeddings != null &&
    store.memories >= 10 &&
    store.missingEmbeddings / store.memories >= 0.5 &&
    input.embedder !== "loading"
  ) {
    out.push({
      level: "warn",
      text: `${store.missingEmbeddings}/${store.memories} memories have no embedding`,
    });
  }

  return out;
}

export function decideFix(snap: DeskSnapshot): {
  action: "start" | "restart" | "checkpoint" | "none";
  reason: string;
} {
  if (!snap.daemon.up) return { action: "start", reason: "daemon is down" };
  if (snap.embedder === "stuck" || snap.embedder === "down") {
    return { action: "restart", reason: "embedder is not healthy" };
  }
  if (snap.store.walBytes >= WARN_WAL) {
    return { action: "checkpoint", reason: "WAL is oversized" };
  }
  if (snap.warnings.some((w) => w.level === "alert")) {
    return { action: "restart", reason: "an alert is showing" };
  }
  return { action: "none", reason: "nothing looks broken" };
}

export function embedderState(opts: {
  daemonUp: boolean;
  ready: boolean;
  startedAt: string | null;
  now?: number;
}): DeskSnapshot["embedder"] {
  if (!opts.daemonUp) return "down";
  if (opts.ready) return "ready";
  const started = opts.startedAt ? Date.parse(opts.startedAt) : NaN;
  const now = opts.now ?? Date.now();
  if (Number.isFinite(started) && now - started > 45_000) return "stuck";
  return "loading";
}
