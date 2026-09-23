import {
  collectStoreStats,
  decideFix,
  embedderState,
  formatAgo,
  formatBytes,
  warningsFor,
  type DeskSnapshot,
} from "./stats";
import {
  checkpointViaApi,
  health,
  restartDaemon,
  startDetach,
  stopDaemon,
  waitForHealth,
} from "./daemon";
import { openDb } from "./db";
import { dbPath, detectPython, MODEL_NAME, port } from "./paths";

const ALT_ON = "\x1b[?1049h\x1b[?25l";
const ALT_OFF = "\x1b[?1049l\x1b[?25h";
const CLEAR = "\x1b[2J\x1b[H";
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";

function paint(ok: boolean, text: string): string {
  return `${ok ? GREEN : RED}${text}${RESET}`;
}

function warnColor(level: "warn" | "alert", text: string): string {
  return `${level === "alert" ? RED : YELLOW}${text}${RESET}`;
}

function formatChars(n: number | null): string {
  if (n == null) return "";
  return `${n.toLocaleString()} chars of log`;
}

type RawSession = { project?: unknown; author?: unknown; since?: unknown };

function plainSession(raw: RawSession) {
  return {
    project: typeof raw.project === "string" ? raw.project : null,
    author: typeof raw.author === "string" ? raw.author : null,
    since: typeof raw.since === "string" ? raw.since : null,
  };
}

async function snapshot(): Promise<DeskSnapshot> {
  const live = await health();
  const store = collectStoreStats();
  const daemonUp = Boolean(live);
  const ready = Boolean(live?.embedder);
  const startedAt = typeof live?.started_at === "string" ? live.started_at : null;
  const pid = typeof live?.pid === "number" ? live.pid : null;
  const embedder = embedderState({ daemonUp, ready, startedAt });
  const rawActive = live?.active as RawSession | null | undefined;
  const rawSessions = Array.isArray(live?.sessions) ? (live.sessions as RawSession[]) : [];
  const sessions = rawSessions.map(plainSession);
  const snap: DeskSnapshot = {
    daemon: {
      up: daemonUp,
      port: typeof live?.port === "number" ? live.port : port(),
      pid,
      startedAt,
    },
    embedder,
    model: typeof live?.model === "string" ? live.model : MODEL_NAME,
    active: rawActive ? plainSession(rawActive) : null,
    sessions,
    store,
    warnings: [],
  };
  const embedderError = typeof live?.embedder_error === "string" ? live.embedder_error : null;
  snap.warnings = warningsFor({ daemonUp, embedder, store, embedderError });
  return snap;
}

function frame(snap: DeskSnapshot, notice: string, now = new Date()): string {
  const { daemon, store } = snap;
  const memStatus = daemon.up ? paint(true, "up      ") : paint(false, "down    ");
  const embLabel =
    snap.embedder === "ready"
      ? paint(true, "ready   ")
      : snap.embedder === "loading"
        ? `${YELLOW}loading ${RESET}`
        : paint(false, snap.embedder === "stuck" ? "stuck   " : "down    ");
  const pid = daemon.pid ? `pid ${daemon.pid}` : "no pid";
  const count = store.memories == null ? "?" : String(store.memories);
  const missing =
    store.missingEmbeddings != null && store.missingEmbeddings > 0
      ? `  ${store.missingEmbeddings} without vectors`
      : "";
  // With two sessions there is no single active one, so the desk shows the
  // most recent check-in and lists the rest on the line below.
  const whose = snap.active ??
    snap.sessions[0] ?? { project: null, author: null, since: null };
  const lines = [
    `${BOLD}agent-office${RESET}  ${DIM}${now.toISOString().slice(11, 19)} UTC${RESET}`,
    "",
    `Memory     ${memStatus}  ${pid.padEnd(12)}  127.0.0.1:${daemon.port}`,
    `Embedder   ${embLabel}  ${snap.model ?? MODEL_NAME}`,
    `Python     ${DIM}${detectPython()}${RESET}`,
    "",
    `Project    ${whose.project ?? `${DIM}none declared${RESET}`}`,
    `           ${DIM}${whose.project || whose.since ? `by ${whose.author ?? "unnamed"}  ${formatAgo(whose.since, now.getTime())}` : "agents name their target with: office begin --project <path> --by <agent>"}${RESET}`,
    ...(snap.sessions.length > 1
      ? [
          `Sessions   ${snap.sessions.length}   ${DIM}${snap.sessions
            .map((s) => `${s.author ?? "unnamed"} ${formatAgo(s.since, now.getTime())}`)
            .join(", ")}${RESET}`,
        ]
      : []),
    "",
    `Database   ${count} memories   ${formatBytes(store.totalBytes)}${missing}`,
    `           db ${formatBytes(store.bytes)}   wal ${formatBytes(store.walBytes)}   shm ${formatBytes(store.shmBytes)}`,
    `           ${DIM}${store.path}${RESET}`,
    `Work       ${store.workOpen ?? "?"} open   ${store.workTotal ?? "?"} in the trail   ${formatChars(store.logChars)}`,
    `Tools      ${store.tools ?? "?"}   ${DIM}always loaded, from the database${RESET}`,
    `Last write ${formatAgo(store.lastWrite, now.getTime())}`,
    `Writes     last hour ${store.lastHour ?? "?"}    today ${store.lastDay ?? "?"}`,
    store.maxChars ? `Largest    ${store.maxChars.toLocaleString()} chars` : `Largest    —`,
    "",
  ];

  if (snap.warnings.length) {
    lines.push("Look at");
    for (const w of snap.warnings) {
      lines.push(`  ${warnColor(w.level, w.text)}`);
    }
    if (snap.warnings.some((w) => w.level === "alert")) {
      lines.push(`  ${DIM}office logs — the daemon's own side of it${RESET}`);
    }
  } else {
    lines.push(`${GREEN}Look at${RESET}   nothing odd`);
  }

  lines.push("");
  if (notice) lines.push(`${YELLOW}${notice}${RESET}`, "");
  lines.push(`${DIM}s start/stop    r restart    f fix    q leave${RESET}`);
  lines.push(`${DIM}keys are on this screen. agents still use the CLI.${RESET}`);
  return lines.join("\n") + "\n";
}

async function applyFix(snap: DeskSnapshot): Promise<string> {
  const plan = decideFix(snap);
  if (plan.action === "none") return plan.reason;
  if (plan.action === "start") {
    await startDetach();
    await waitForHealth();
    return `started daemon (${plan.reason})`;
  }
  if (plan.action === "restart") {
    const h = await restartDaemon();
    return h ? `restarted daemon (${plan.reason})` : `restart failed (${plan.reason})`;
  }
  if (plan.action === "checkpoint") {
    if (snap.daemon.up) {
      await checkpointViaApi();
    } else {
      const db = openDb(dbPath());
      try {
        db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
      } finally {
        db.close();
      }
    }
    return `checkpointed WAL (${plan.reason})`;
  }
  return plan.reason;
}

export async function runTui(): Promise<number> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const snap = await snapshot();
    process.stdout.write(JSON.stringify(snap, null, 2) + "\n");
    return snap.daemon.up ? 0 : 1;
  }

  process.stdout.write(ALT_ON);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  let notice = "";
  let noticeUntil = 0;
  let closed = false;
  let drawing = false;

  const draw = async () => {
    if (closed || drawing) return;
    drawing = true;
    try {
      const snap = await snapshot();
      const msg = Date.now() < noticeUntil ? notice : "";
      process.stdout.write(CLEAR + frame(snap, msg));
    } finally {
      drawing = false;
    }
  };

  const say = (text: string) => {
    notice = text;
    noticeUntil = Date.now() + 4000;
  };

  const cleanup = () => {
    if (closed) return;
    closed = true;
    try {
      process.stdin.setRawMode(false);
    } catch {
      // ignore
    }
    process.stdout.write(ALT_OFF);
  };

  const onData = async (chunk: Buffer | string) => {
    const key = typeof chunk === "string" ? chunk : chunk.toString("utf8");
    if (key === "\x03" || key === "q" || key === "Q") {
      cleanup();
      process.exit(0);
    }
    if (key === "s" || key === "S") {
      const snap = await snapshot();
      if (snap.daemon.up) {
        await stopDaemon();
        say("memory daemon stopped");
      } else {
        await startDetach();
        const h = await waitForHealth();
        say(h ? "memory daemon started" : "start failed — try office serve in a terminal");
      }
      await draw();
      return;
    }
    if (key === "r" || key === "R") {
      const h = await restartDaemon();
      say(h ? "restarted" : "restart failed");
      await draw();
      return;
    }
    if (key === "f" || key === "F") {
      try {
        const snap = await snapshot();
        say(await applyFix(snap));
      } catch (err) {
        say(err instanceof Error ? err.message : String(err));
      }
      await draw();
    }
  };

  process.stdin.on("data", (chunk) => {
    void onData(chunk);
  });
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGWINCH", () => {
    void draw();
  });

  await draw();
  while (!closed) {
    await Bun.sleep(1000);
    if (!closed) await draw();
  }
  cleanup();
  return 0;
}
