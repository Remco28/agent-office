import { afterEach, describe, expect, test } from "bun:test";
import { remember, searchDetailed } from "../src/memory";
import { listWork } from "../src/work";
import { normalizeProject } from "../src/scope";
import {
  beginSession,
  briefing,
  claimIdentity,
  listSessions,
  pruneSessions,
  resolveScope,
} from "../src/session";
import { groupedEmbedder, tempDb } from "./helpers";

describe("review fixes", () => {
  const dbs: ReturnType<typeof tempDb>[] = [];
  afterEach(() => {
    for (const db of dbs) db.close();
    dbs.length = 0;
  });

  test("a busy neighbour cannot crowd a project's own matches out of its search", async () => {
    const db = tempDb();
    dbs.push(db);
    const embedder = groupedEmbedder();
    for (let i = 0; i < 40; i++) {
      await remember(db, embedder, { content: `deploy step ${i} for the release`, project: "busy" });
    }
    await remember(db, embedder, { content: "deploy from the release branch", project: "quiet" });
    const result = await searchDetailed(db, embedder, "deploy release", 8, { project: "quiet" });
    expect(result.hits.map((h) => h.content)).toEqual(["deploy from the release branch"]);
    expect(result.hits[0].via).toBe("fts+vector");
  });

  test("a limit that is not a number falls back instead of failing the read", async () => {
    const db = tempDb();
    dbs.push(db);
    const embedder = groupedEmbedder();
    await remember(db, embedder, { content: "deploy notes", project: "alpha" });
    const result = await searchDetailed(db, embedder, "", Number("abc"), { project: "alpha" });
    expect(result.hits.length).toBe(1);
    expect(listWork(db, { kind: "all" }, { limit: Number("abc") })).toEqual([]);
  });

  test("a dot or dot-dot project is a path, not a project named '.'", () => {
    expect(normalizeProject(".")).toBe(process.cwd());
    expect(normalizeProject("..")).not.toBe("..");
  });

  test("a bare name becomes a numbered run, and a numbered name resumes", () => {
    const db = tempDb();
    dbs.push(db);
    const first = claimIdentity(db, "Codex");
    expect(first.minted).toBe(true);
    expect(first.author).toMatch(/^codex-\d{4}$/);
    beginSession(db, { project: "/p/one", author: first.author });
    const second = claimIdentity(db, "codex");
    expect(second.author).not.toBe(first.author);
    expect(claimIdentity(db, first.author!.toUpperCase())).toEqual({
      author: first.author,
      minted: false,
    });
  });

  test("one name in any case is one session", () => {
    const db = tempDb();
    dbs.push(db);
    beginSession(db, { project: "/p/one", author: "Buffy-1234" });
    expect(resolveScope(db, { author: "buffy-1234" }).project).toBe("/p/one");
    expect(listSessions(db).length).toBe(1);
  });

  test("sessions unseen for a month are pruned, but never the caller", () => {
    const db = tempDb();
    dbs.push(db);
    const old = new Date(Date.now() - 40 * 86_400_000).toISOString();
    db.query("INSERT INTO session_state (author, project, updated_at) VALUES (?, ?, ?)").run("gone-1111", null, old);
    db.query("INSERT INTO session_state (author, project, updated_at) VALUES (?, ?, ?)").run("me-2222", null, old);
    beginSession(db, { project: "/p", author: "fresh-3333" });
    expect(pruneSessions(db, "me-2222")).toBe(1);
    expect(listSessions(db).map((s) => s.author).sort()).toEqual(["fresh-3333", "me-2222"]);
  });

  test("a briefing names recent sessions only, and counts the rest", async () => {
    const db = tempDb();
    dbs.push(db);
    const old = new Date(Date.now() - 20 * 86_400_000).toISOString();
    db.query("INSERT INTO session_state (author, project, updated_at) VALUES (?, ?, ?)").run("stale-1111", "/p", old);
    for (let i = 0; i < 10; i++) beginSession(db, { project: "/p", author: `agent-${1000 + i}` });
    const data = await briefing(db, null, { declared: { project: "/p", author: "stale-1111" }, minted: false });
    expect(data.sessions.length).toBe(9);
    expect(data.sessions.some((s) => s.is_you)).toBe(true);
    expect(data.sessions_hidden).toBe(2);
    expect(data.identity_note).toBeNull();
    const minted = await briefing(db, null, { declared: { project: "/p", author: "agent-1000" }, minted: true });
    expect(minted.identity_note).toContain("--by agent-1000");
  });
});
