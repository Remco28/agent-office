import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db";
import { fakeEmbedder } from "../src/embed";
import {
  closeIssue,
  closedSince,
  getIssue,
  listIssues,
  noteIssue,
  openIssue,
  openIssueCount,
} from "../src/issues";
import {
  BRIEFING_ISSUES,
  beginSession,
  briefing,
  getSession,
} from "../src/session";
import { listWork, openWork, openWorkCount, workCount } from "../src/work";
import { tempDb } from "./helpers";

describe("issues", () => {
  const dbs: ReturnType<typeof tempDb>[] = [];
  afterEach(() => {
    for (const db of dbs) db.close();
    dbs.length = 0;
  });
  const fresh = () => {
    const db = tempDb();
    dbs.push(db);
    return db;
  };

  test("closed is derived from the trail, and the trail keeps everything", () => {
    const db = fresh();
    const issue = openIssue(db, { title: "begin lists stale sessions as present", author: "a-1111" });
    expect(issue.closed).toBe(false);

    noteIssue(db, issue.id, { text: "only after compaction", author: "b-2222" });
    expect(getIssue(db, issue.id)!.last_note).toBe("only after compaction");

    const closed = closeIssue(db, issue.id, { text: "fixed in 1f3b6e0", author: "m-3333" });
    expect(closed.closed).toBe(true);
    expect(closed.closed_by).toBe("m-3333");
    expect(closed.resolution).toBe("fixed in 1f3b6e0");
    expect(closed.events).toBe(3);
    expect(listIssues(db)).toHaveLength(0);
    expect(listIssues(db, { includeClosed: true })).toHaveLength(1);
    expect(openIssueCount(db)).toBe(0);
  });

  test("an issue cannot be closed without saying what came of it", () => {
    const db = fresh();
    const issue = openIssue(db, { title: "tools list is stale" });
    expect(() => closeIssue(db, issue.id, { text: "  " })).toThrow(/resolution/);
    expect(getIssue(db, issue.id)!.closed).toBe(false);
  });

  test("a closed or missing issue refuses further writes", () => {
    const db = fresh();
    const issue = openIssue(db, { title: "x" });
    closeIssue(db, issue.id, { text: "done" });
    expect(() => noteIssue(db, issue.id, { text: "more" })).toThrow(/already closed/);
    expect(() => closeIssue(db, issue.id, { text: "again" })).toThrow(/already closed/);
    expect(() => noteIssue(db, 999, { text: "?" })).toThrow(/no issue #999/);
    expect(() => openIssue(db, { title: "  " })).toThrow(/title/);
  });

  test("issues are about the office, so they never become a project's work", () => {
    const db = fresh();
    openIssue(db, { title: "office blocks X", project: "/p/alpha", author: "a-1111" });
    openWork(db, { title: "alpha refactor", project: "/p/alpha" });

    expect(workCount(db)).toBe(1);
    expect(openWorkCount(db)).toBe(1);
    expect(listWork(db, { kind: "all" }).map((w) => w.title)).toEqual(["alpha refactor"]);
    expect(listWork(db, { kind: "unclaimed" })).toHaveLength(0);
  });

  test("the project is where it surfaced, not a filter on who sees it", async () => {
    const db = fresh();
    openIssue(db, { title: "needs ABC tool", project: "/p/alpha" });
    expect(getIssue(db, 1)!.project).toBe("/p/alpha");

    for (const declared of [{ project: "/p/alpha" }, { project: "/p/beta" }, {}]) {
      const result = await briefing(db, fakeEmbedder(), { declared });
      expect(result.issues.map((i) => i.title)).toEqual(["needs ABC tool"]);
      expect(result.issues_open).toBe(1);
    }
  });

  test("the briefing lists a few open issues and counts the rest", async () => {
    const db = fresh();
    for (let n = 1; n <= BRIEFING_ISSUES + 3; n++) openIssue(db, { title: `issue ${n}` });
    closeIssue(db, 1, { text: "done" });

    const result = await briefing(db, fakeEmbedder());
    expect(result.issues).toHaveLength(BRIEFING_ISSUES);
    expect(result.issues_open).toBe(BRIEFING_ISSUES + 2);
    expect(result.store.issues_open).toBe(BRIEFING_ISSUES + 2);
    expect(result.issues.map((i) => i.title)).not.toContain("issue 1");
  });

  test("the filer is told when someone else closed what they raised", async () => {
    const db = fresh();
    const mine = openIssue(db, { title: "mine, closed by someone", author: "a-1111" });
    const selfClosed = openIssue(db, { title: "mine, closed by me", author: "a-1111" });
    const theirs = openIssue(db, { title: "theirs", author: "b-2222" });
    const early = openIssue(db, { title: "closed before the watermark", author: "a-1111" });
    closeIssue(db, early.id, { text: "old news", author: "m-3333" });
    const watermark = new Date().toISOString();
    await Bun.sleep(5);
    closeIssue(db, mine.id, { text: "fixed", author: "m-3333" });
    closeIssue(db, selfClosed.id, { text: "my mistake", author: "a-1111" });
    closeIssue(db, theirs.id, { text: "fixed", author: "m-3333" });

    const news = closedSince(db, { author: "a-1111", since: watermark });
    expect(news.map((i) => i.title)).toEqual(["mine, closed by someone"]);
    expect(news[0].resolution).toBe("fixed");

    const result = await briefing(db, fakeEmbedder(), {
      since: watermark,
      declared: { author: "a-1111" },
    });
    expect(result.issues_closed.map((i) => i.title)).toEqual(["mine, closed by someone"]);

    // no watermark or no name: there is no "since you were last here" to answer
    expect(closedSince(db, { author: "a-1111", since: null })).toEqual([]);
    expect(closedSince(db, { author: null, since: watermark })).toEqual([]);
  });
});

describe("the office manager role is gone", () => {
  test("a store that still has the role column keeps its sessions and keeps working", () => {
    const dir = mkdtempSync(join(tmpdir(), "office-prerole-"));
    const path = join(dir, "memory.db");
    const old = new Database(path, { create: true });
    old.exec(`CREATE TABLE session_state (
      author TEXT PRIMARY KEY NOT NULL, project TEXT, updated_at TEXT NOT NULL, role TEXT
    )`);
    old.query("INSERT INTO session_state VALUES (?, ?, ?, ?)").run(
      "a-1111",
      "/p/alpha",
      new Date().toISOString(),
      "manager",
    );
    old.close();

    const db = openDb(path);
    expect(getSession(db, "a-1111")).toEqual({
      project: "/p/alpha",
      author: "a-1111",
      updated_at: expect.any(String),
    });
    beginSession(db, { author: "a-1111", project: "/p/beta" });
    expect(getSession(db, "a-1111")?.project).toBe("/p/beta");
    db.close();
  });
});
