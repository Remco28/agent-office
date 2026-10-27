import { afterEach, describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { fakeEmbedder } from "../src/embed";
import { remember } from "../src/memory";
import {
  BRIEFING_NOTICES,
  authorWarnings,
  beginSession,
  briefing,
  getSession,
  listSessions,
  peekSession,
  resolveScope,
  setActive,
} from "../src/session";
import { upsertTool } from "../src/tools";
import { noteWork, openWork } from "../src/work";
import { tempDb } from "./helpers";

describe("session", () => {
  const dbs: ReturnType<typeof tempDb>[] = [];
  afterEach(() => {
    for (const db of dbs) db.close();
    dbs.length = 0;
  });

  test("the briefing gathers what a fresh session needs", async () => {
    const db = tempDb();
    dbs.push(db);
    const embedder = fakeEmbedder();
    upsertTool(db, { name: "rg", summary: "local ripgrep" });
    await remember(db, embedder, { content: "always use tabs", scope: "global" });
    await remember(db, embedder, { content: "alpha checkout limit", project: "alpha" });
    await remember(db, embedder, { content: "beta only note", project: "beta" });
    openWork(db, { title: "alpha refactor", project: "alpha" });
    openWork(db, { title: "beta cleanup", project: "beta" });
    const result = await briefing(db, embedder, { cwdProject: "alpha" });
    expect(result.project).toBe("alpha");
    expect(result.author).toBeNull();
    expect(result.note).toBeNull();
    expect(result.tools.map((t) => t.name)).toEqual(["rg"]);
    expect(result.preferences.map((m) => m.content)).toEqual(["always use tabs"]);
    expect(result.open_work.map((w) => w.title)).toEqual(["alpha refactor"]);

    const contents = result.memories.map((m) => m.content);
    expect(contents).toContain("alpha checkout limit");
    expect(contents).not.toContain("beta only note");
    // an everywhere-note is delivered once, under preferences, not twice
    expect(contents).not.toContain("always use tabs");

    expect(result.store.memories_in_scope).toBe(2);
    expect(result.store.work_open).toBe(2);
    expect(result.store.tools).toBe(1);
  });

  test("an empty project briefing says so instead of guessing", async () => {
    const db = tempDb();
    dbs.push(db);
    const result = await briefing(db, fakeEmbedder(), { cwdProject: "nothing-here" });
    expect(result.memories).toEqual([]);
    expect(result.note).toContain("nothing recorded");
  });

  test("a briefing with no project hands over nothing project-specific", async () => {
    const db = tempDb();
    dbs.push(db);
    const embedder = fakeEmbedder();
    await remember(db, embedder, { content: "alpha checkout limit", project: "alpha" });
    await remember(db, embedder, { content: "beta only note", project: "beta" });
    openWork(db, { title: "alpha refactor", project: "alpha" });

    const result = await briefing(db, embedder);
    expect(result.project).toBeNull();
    expect(result.note).toContain("no project declared");
    // another project's notes and loose ends are not handed over on the way to
    // finding that out
    expect(result.memories).toEqual([]);
    expect(result.open_work).toEqual([]);
    // but the office still reports the store it is holding back
    expect(result.store.memories).toBe(2);
    expect(result.store.memories_in_scope).toBe(0);
    expect(result.store.work_open).toBe(1);
  });

  test("a remembered project never decides where a call is filed", () => {
    const db = tempDb();
    dbs.push(db);
    beginSession(db, { project: "/p/alpha", author: "freebuff" });

    // the session's own row says alpha, but nothing is taken from memory:
    // a call that names no project and runs outside a repository has none
    const scope = resolveScope(db, { author: "freebuff" });
    expect(scope.project).toBeNull();
    expect(scope.project_source).toBe("none");
    expect(scope.author).toBe("freebuff");
    expect(scope.author_source).toBe("declared");
    expect(getSession(db, "freebuff")?.project).toBe("/p/alpha");
  });

  test("the project is what the call declared, else its folder, else none", () => {
    const db = tempDb();
    dbs.push(db);
    expect(resolveScope(db, { project: "/p/declared", cwdProject: "/p/folder" })).toMatchObject({
      project: "/p/declared",
      project_source: "declared",
    });
    expect(resolveScope(db, { cwdProject: "/p/folder" })).toMatchObject({
      project: "/p/folder",
      project_source: "folder",
    });
    expect(resolveScope(db)).toMatchObject({ project: null, project_source: "none" });
  });

  test("an author is only what the call declared; another session's name is never lent", () => {
    const db = tempDb();
    dbs.push(db);
    beginSession(db, { project: "/p/alpha", author: "freebuff" });

    // exactly one session on the machine and no name declared: still nobody.
    // This is the fallback that used to sign OpenCode's work 'freebuff'.
    const scope = resolveScope(db, { cwdProject: "/p/alpha" });
    expect(scope.author).toBeNull();
    expect(scope.author_source).toBe("none");
  });

  test("a second agent cannot inherit or overwrite the first agent's session", async () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "/p/alpha", author: "freebuff" });
    await Bun.sleep(5);
    setActive(db, { project: "/p/beta", author: "opencode" });

    // the second check-in left the first row exactly where it was
    expect(getSession(db, "freebuff")?.project).toBe("/p/alpha");
    expect(getSession(db, "opencode")?.project).toBe("/p/beta");
    expect(listSessions(db).map((s) => s.author)).toEqual(["opencode", "freebuff"]);
  });

  test("a caller with no name has no session and is told its writes are unsigned", () => {
    const db = tempDb();
    dbs.push(db);
    const begun = beginSession(db, { project: "/p/alpha", author: null });
    expect(begun.previous).toBeNull();
    expect(begun.current).toBeNull();
    expect(listSessions(db)).toEqual([]);

    const warnings = authorWarnings(resolveScope(db, { cwdProject: "/p/alpha" }));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.text).toContain("unsigned");
    // naming yourself is never a warning
    expect(authorWarnings(resolveScope(db, { author: "freebuff" }))).toEqual([]);
  });

  test("a bare name with no check-in behind it is pointed out", () => {
    const db = tempDb();
    dbs.push(db);
    const note = resolveScope(db, { author: "codex", cwdProject: "/p/alpha" }).scope_note;
    expect(note).toContain('"codex" is a name with no check-in behind it');
    // a numbered name, or a name that checked in, is not
    expect(resolveScope(db, { author: "codex-4821", cwdProject: "/p/alpha" }).scope_note).toBeNull();
    beginSession(db, { project: "/p/alpha", author: "opencode" });
    expect(resolveScope(db, { author: "opencode", cwdProject: "/p/alpha" }).scope_note).toBeNull();
  });

  test("a named check-in records where it checked in this time, even nowhere", () => {
    const db = tempDb();
    dbs.push(db);
    beginSession(db, { author: "freebuff", cwdProject: "/p/alpha" });
    expect(getSession(db, "freebuff")?.project).toBe("/p/alpha");
    // checked in again from outside any repository: it is no longer listed as on alpha
    beginSession(db, { author: "freebuff" });
    expect(getSession(db, "freebuff")?.project).toBeNull();
  });

  test("begin with --project outside a repository says the next command needs it too", async () => {
    const db = tempDb();
    dbs.push(db);
    beginSession(db, { project: "/p/alpha", author: "freebuff" });
    const result = await briefing(db, fakeEmbedder(), {
      declared: { project: "/p/alpha", author: "freebuff" },
    });
    expect(result.scope_note).toContain("not a git repository");
    const inRepo = await briefing(db, fakeEmbedder(), {
      declared: { project: "/p/alpha", author: "freebuff" },
      cwdProject: "/p/alpha",
    });
    expect(inRepo.scope_note).toBeNull();
  });

  test("begin reads the last visit before it overwrites it", async () => {
    const db = tempDb();
    dbs.push(db);
    const first = beginSession(db, { project: "alpha", author: "freebuff" });
    expect(first.previous).toBeNull();
    expect(first.current?.project).toBe("alpha");

    await Bun.sleep(5);
    openWork(db, { title: "alpha thing", project: "alpha", author: "opencode" });
    await Bun.sleep(5);

    const second = beginSession(db, { project: "alpha", author: "freebuff" });
    expect(second.previous?.updated_at).toBe(first.current?.updated_at);
    expect(second.current?.updated_at).not.toBe(second.previous?.updated_at);
  });

  test("notices are what someone else did since you were last here", async () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    const item = openWork(db, { title: "alpha thing", project: "alpha", author: "freebuff" });
    await Bun.sleep(5);
    const watermark = new Date().toISOString();
    await Bun.sleep(5);

    noteWork(db, item.id, { text: "half done", author: "opencode" });
    noteWork(db, item.id, { text: "my own note", author: "freebuff" });
    noteWork(db, item.id, { text: "no signature at all", author: null });
    openWork(db, { title: "beta thing", project: "beta", author: "opencode" });

    // the caller has to say who it is before "not mine" means anything: a
    // declaration is the only thing that sets an author now
    const result = await briefing(db, fakeEmbedder(), {
      since: watermark,
      declared: { project: "alpha", author: "freebuff" },
    });
    // in scope, not mine, newest first
    expect(result.notices.map((n) => n.text)).toEqual(["no signature at all", "half done"]);
    expect(result.notices[0]?.work_id).toBe(item.id);
    expect(result.notices_since).toBe(watermark);
  });

  test("newer everywhere-memories do not crowd a project's own out of its briefing", async () => {
    const db = tempDb();
    dbs.push(db);
    const embedder = fakeEmbedder();
    await remember(db, embedder, { content: "alpha's own note", project: "alpha" });
    for (let i = 0; i < 10; i++) await remember(db, embedder, { content: `everywhere ${i}`, scope: "global" });

    const result = await briefing(db, embedder, { declared: { project: "alpha" } });
    expect(result.memories.map((m) => m.content)).toEqual(["alpha's own note"]);
  });

  test("a first visit is handed recent activity, framed, not the whole trail", async () => {
    const db = tempDb();
    dbs.push(db);
    const item = openWork(db, { title: "old thing", project: "alpha", author: "opencode" });
    noteWork(db, item.id, { text: "written before you existed", author: "opencode" });
    openWork(db, { title: "beta's business", project: "beta", author: "opencode" });

    const result = await briefing(db, fakeEmbedder(), { declared: { project: "alpha" } });
    // No visit of its own to measure from. Answering that with nothing is what
    // sends a stranger hunting the machine for changes it never made, so the
    // project's recent activity is handed over instead — and only that
    // project's: the briefing never carries another project's details.
    expect(result.notices.map((n) => n.text)).toEqual(["written before you existed", "old thing"]);
    expect(result.notices[0]?.project).toBe("alpha");
    expect(result.notices_since).toBeNull();
    expect(result.notices_note).toContain("most recent activity");
    // the trail itself is still not spilled: the cap holds
    expect(result.notices.length).toBeLessThanOrEqual(BRIEFING_NOTICES);
    expect(result.author_warnings.length).toBeGreaterThan(0);

    // with no project there is no activity to hand over, not every project's
    const nowhere = await briefing(db, fakeEmbedder());
    expect(nowhere.notices).toEqual([]);
    expect(nowhere.notices_note).toBeNull();
  });

  test("a visit with a watermark of its own is not given the stranger's frame", async () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    const result = await briefing(db, fakeEmbedder(), {
      since: new Date().toISOString(),
      declared: { project: "alpha", author: "freebuff" },
    });
    expect(result.notices_note).toBeNull();
  });

  test("unfinished work with no project is handed over rather than hidden", async () => {
    const db = tempDb();
    dbs.push(db);
    const orphan = openWork(db, { title: "filed with nobody looking" });
    openWork(db, { title: "alpha refactor", project: "alpha" });

    // No project named: another project's work is not lent to us...
    const stranger = await briefing(db, fakeEmbedder());
    expect(stranger.open_work.map((w) => w.id)).toEqual([orphan.id]);
    expect(stranger.open_work_note).toContain("no project declared");
    // ...but the orphan is, because it belongs to nobody, and it is counted
    // among the records no project-scoped read can reach
    expect(stranger.store.unattributed).toBe(1);

    // the project's own read is what hands over its work
    const scoped = await briefing(db, fakeEmbedder(), { declared: { project: "alpha" } });
    expect(scoped.open_work.map((w) => w.title)).toEqual(["alpha refactor"]);
    expect(scoped.open_work_note).toBeNull();
  });

  test("sessions say how long ago they were last seen", async () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    const result = await briefing(db, fakeEmbedder(), { declared: { author: "freebuff" } });
    expect(result.sessions[0]?.since).toBeTruthy();
    // a bare timestamp reads as if the session were still running
    expect(result.sessions[0]?.last_seen).toBe("just now");
  });

  test("the briefing says who else is on this project, and which one is you", async () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    await Bun.sleep(5);
    setActive(db, { project: "beta", author: "codex" });
    await Bun.sleep(5);
    setActive(db, { project: "alpha", author: "opencode" });

    // a launcher that exports OFFICE_AUTHOR attributes correctly without
    // touching what the office remembers for anyone else: the caller resolves
    // its own environment and declares the answer in the request
    const result = await briefing(db, fakeEmbedder(), {
      declared: { author: "freebuff" },
      cwdProject: "alpha",
    });
    // codex is on beta: another project's session is not listed, only counted
    expect(result.sessions.map((s) => s.author)).toEqual(["opencode", "freebuff"]);
    expect(result.sessions.map((s) => s.is_you)).toEqual([false, true]);
    expect(result.sessions_hidden).toBe(1);
    expect(result.author).toBe("freebuff");
    expect(result.project).toBe("alpha");
  });

  test("the daemon's own environment does not name an unnamed caller", async () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    setActive(db, { project: "beta", author: "opencode" });

    // This used to be read out of `process.env` *inside the daemon*, so a
    // daemon started with OFFICE_AUTHOR=probe signed every unnamed write on the
    // machine with that name and reported it as `declared`. The daemon is
    // shared and long-lived; its environment is not the caller's.
    const previous = process.env.OFFICE_AUTHOR;
    process.env.OFFICE_AUTHOR = "probe";
    try {
      const scope = resolveScope(db);
      expect(scope.author).toBeNull();
      expect(scope.author_source).toBe("none");
      const result = await briefing(db, fakeEmbedder(), { declared: {} });
      expect(result.author).toBeNull();
      expect(result.sessions.every((s) => !s.is_you)).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.OFFICE_AUTHOR;
      else process.env.OFFICE_AUTHOR = previous;
    }
  });

  test("a peek is a begin with none of the writes", () => {
    const db = tempDb();
    dbs.push(db);
    const begun = beginSession(db, { project: "alpha", author: "freebuff" });
    const mark = begun.current!.updated_at;

    const peeked = peekSession(db, { project: "/p/elsewhere", author: "freebuff" });
    // the check-in mark is read and left exactly where it was: no row written,
    // no project replaced, nothing set
    expect(peeked.previous?.updated_at).toBe(mark);
    expect(peeked.current).toBeNull();
    expect(getSession(db, "freebuff")?.updated_at).toBe(mark);
    expect(getSession(db, "freebuff")?.project).toBe("alpha");
  });

  test("a peek by an author the office has never seen leaves no row behind", () => {
    const db = tempDb();
    dbs.push(db);
    const peeked = peekSession(db, { project: "alpha", author: "newcomer" });

    expect(peeked.previous).toBeNull();
    expect(getSession(db, "newcomer")).toBeNull();
    expect(listSessions(db)).toEqual([]);
  });

  test("a read-only visit reports notices without advancing the mark", async () => {
    const db = tempDb();
    dbs.push(db);
    const begun = beginSession(db, { project: "alpha", author: "freebuff" });
    const mark = begun.current!.updated_at;
    await Bun.sleep(5);
    const item = openWork(db, { title: "alpha thing", project: "alpha", author: "freebuff" });
    await Bun.sleep(5);
    noteWork(db, item.id, { text: "someone else's note", author: "opencode" });

    const read = await briefing(db, fakeEmbedder(), {
      since: peekSession(db, { author: "freebuff" }).previous?.updated_at ?? null,
      declared: { project: "alpha", author: "freebuff" },
      readonly: true,
    });
    expect(read.readonly).toBe(true);
    expect(read.readonly_note).toContain("did not move");
    expect(read.notices.map((n) => n.text)).toEqual(["someone else's note"]);

    // nothing moved, so a second peek is handed the same thing
    expect(getSession(db, "freebuff")?.updated_at).toBe(mark);
    const repeat = await briefing(db, fakeEmbedder(), {
      since: mark,
      declared: { project: "alpha", author: "freebuff" },
      readonly: true,
    });
    expect(repeat.notices.map((n) => n.text)).toEqual(["someone else's note"]);

    // a real check-in moves the mark, and only what follows it is news
    const checkedIn = beginSession(db, { project: "alpha", author: "freebuff" });
    expect(checkedIn.current!.updated_at).not.toBe(mark);
    const quiet = await briefing(db, fakeEmbedder(), {
      since: checkedIn.current!.updated_at,
      declared: { project: "alpha", author: "freebuff" },
    });
    expect(quiet.readonly).toBe(false);
    expect(quiet.readonly_note).toBeNull();
    expect(quiet.notices).toEqual([]);
  });

  test("a read-only visit with no check-in says there is nothing to measure", async () => {
    const db = tempDb();
    dbs.push(db);
    const result = await briefing(db, fakeEmbedder(), { readonly: true });

    expect(result.readonly).toBe(true);
    expect(result.notices).toEqual([]);
    expect(result.readonly_note).toContain("no previous check-in");
  });
});
