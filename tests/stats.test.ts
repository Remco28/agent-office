import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db";
import { fakeEmbedder } from "../src/embed";
import { remember } from "../src/memory";
import {
  ALERT_COUNT,
  WARN_BYTES,
  WARN_HOUR,
  WARN_WAL,
  collectStoreStats,
  decideFix,
  embedderState,
  formatBytes,
  warningsFor,
  type DeskSnapshot,
} from "../src/stats";

function emptyDesk(over: Partial<DeskSnapshot> = {}): DeskSnapshot {
  const store = {
    path: "/tmp/x.db",
    exists: true,
    bytes: 100,
    walBytes: 0,
    shmBytes: 0,
    totalBytes: 100,
    memories: 2,
    missingEmbeddings: 0,
    lastWrite: new Date().toISOString(),
    lastHour: 0,
    lastDay: 2,
    maxChars: 20,
    unattributed: 0,
    workOpen: 0,
    workTotal: 0,
    logChars: 0,
    tools: 0,
  };
  return {
    daemon: { up: true, port: 7701, pid: 1, startedAt: new Date().toISOString() },
    embedder: "ready",
    model: "all-MiniLM-L6-v2",
    active: null,
    sessions: [],
    warnings: [],
    ...over,
    store: { ...store, ...(over.store ?? {}) },
  };
}

describe("stats", () => {
  test("formatBytes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
  });

  test("embedderState", () => {
    expect(embedderState({ daemonUp: false, ready: false, startedAt: null })).toBe("down");
    expect(embedderState({ daemonUp: true, ready: true, startedAt: null })).toBe("ready");
    expect(
      embedderState({
        daemonUp: true,
        ready: false,
        startedAt: new Date().toISOString(),
      }),
    ).toBe("loading");
    expect(
      embedderState({
        daemonUp: true,
        ready: false,
        startedAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    ).toBe("stuck");
  });

  test("warnings for runaway size and writes", () => {
    const size = warningsFor({
      daemonUp: true,
      embedder: "ready",
      store: emptyDesk().store,
    });
    expect(size.length).toBe(0);

    const big = warningsFor({
      daemonUp: true,
      embedder: "ready",
      store: {
        ...emptyDesk().store,
        totalBytes: WARN_BYTES,
        lastHour: WARN_HOUR,
        memories: ALERT_COUNT,
        walBytes: WARN_WAL,
        maxChars: 50_000,
      },
    });
    const texts = big.map((w) => w.text).join("\n");
    expect(texts).toContain("database is");
    expect(texts).toContain("writes in the last hour");
    expect(texts).toContain("looks runaway");
    expect(texts).toContain("WAL");
    expect(texts).toContain("chars");
  });

  test("decideFix", () => {
    expect(decideFix(emptyDesk({ daemon: { up: false, port: 7701, pid: null, startedAt: null } })).action).toBe(
      "start",
    );
    expect(decideFix(emptyDesk({ embedder: "stuck" })).action).toBe("restart");
    expect(
      decideFix(emptyDesk({ store: { ...emptyDesk().store, walBytes: WARN_WAL, totalBytes: WARN_WAL } }))
        .action,
    ).toBe("checkpoint");
    expect(decideFix(emptyDesk()).action).toBe("none");
  });

  test("collectStoreStats reads a real db", async () => {
    const dir = mkdtempSync(join(tmpdir(), "office-stats-"));
    const path = join(dir, "memory.db");
    const db = openDb(path);
    await remember(db, fakeEmbedder(), { content: "a small note" });
    db.close();
    writeFileSync(`${path}-wal`, "x".repeat(100));
    const stats = collectStoreStats(path);
    expect(stats.memories).toBe(1);
    expect(stats.walBytes).toBe(100);
    expect(stats.totalBytes).toBeGreaterThan(100);
    expect(stats.lastHour).toBe(1);
  });
});
