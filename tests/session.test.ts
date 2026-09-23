import { afterEach, describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { fakeEmbedder } from "../src/embed";
import { remember } from "../src/memory";
import {
  authorWarnings,
  beginSession,
  briefing,
  getActive,
  getSession,
  listSessions,
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
    setActive(db, { project: "alpha", author: "freebuff" });

    const result = await briefing(db, embedder);
    expect(result.project).toBe("alpha");
    expect(result.author).toBe("freebuff");
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
    setActive(db, { project: "nothing-here", author: null });
    const result = await briefing(db, fakeEmbedder());
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

  test("naming a target replaces what the office remembered, for that author", () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    setActive(db, { project: "~/Projects/beta", author: "freebuff" });

    const scope = resolveScope(db);
    expect(scope.project).toBe(join(homedir(), "Projects", "beta"));
    expect(scope.author).toBe("freebuff");
    expect(scope.project_source).toBe("active");
    expect(scope.author_source).toBe("active");
    expect(getActive(db)?.project).toBe(join(homedir(), "Projects", "beta"));
  });

  test("a declaration beats what the office remembers, field by field", () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });

    const scope = resolveScope(db, { project: "/somewhere/else" });
    expect(scope.project).toBe("/somewhere/else");
    expect(scope.project_source).toBe("declared");
    // the author was not restated, so the session's author still applies
    expect(scope.author).toBe("freebuff");
    expect(scope.author_source).toBe("active");
  });

  test("with nothing declared and nothing remembered, nothing is invented", () => {
    const db = tempDb();
    dbs.push(db);
    const scope = resolveScope(db);
    expect(scope.project).toBeNull();
    expect(scope.project_source).toBe("none");
    expect(scope.author_source).toBe("none");
  });

  test("a second agent cannot inherit or overwrite the first agent's session", async () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "/p/alpha", author: "freebuff" });
    await Bun.sleep(5);
    setActive(db, { project: "/p/beta", author: "opencode" });

    // the second declaration left the first row exactly where it was
    expect(getSession(db, "freebuff")?.project).toBe("/p/alpha");
    expect(resolveScope(db, { author: "freebuff" }).project).toBe("/p/alpha");
    expect(resolveScope(db, { author: "opencode" }).project).toBe("/p/beta");
    expect(listSessions(db).map((s) => s.author)).toEqual(["opencode", "freebuff"]);
  });

  test("a declared author with no row of its own inherits nothing", () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "/p/alpha", author: "freebuff" });

    const scope = resolveScope(db, { author: "newcomer" });
    expect(scope.author).toBe("newcomer");
    expect(scope.author_source).toBe("declared");
    // somebody else's project is not this session's project
    expect(scope.project).toBeNull();
    expect(scope.project_source).toBe("none");
  });

  test("with two sessions and no declaration the office declines to guess", () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    setActive(db, { project: "beta", author: "opencode" });

    const scope = resolveScope(db);
    expect(scope.author).toBeNull();
    expect(scope.project).toBeNull();
    expect(scope.author_source).toBe("ambiguous");
    expect(scope.project_source).toBe("none");
    // this is the bug: one agent's identity handed to another. There is no
    // single session to remember, so there is no answer.
    expect(getActive(db)).toBeNull();
  });

  test("a session that declines to name itself is told which case it is in", () => {
    const db = tempDb();
    dbs.push(db);
    expect(authorWarnings(resolveScope(db))[0]?.text).toContain("no session recorded");

    setActive(db, { project: "alpha", author: "freebuff" });
    expect(authorWarnings(resolveScope(db))[0]?.text).toContain(
      "using the remembered session `freebuff`",
    );

    setActive(db, { project: "beta", author: "opencode" });
    const ambiguous = authorWarnings(resolveScope(db));
    expect(ambiguous[0]?.level).toBe("alert");
    expect(ambiguous[0]?.text).toContain("unattributed rather than guessed");
    // naming yourself is never a warning
    expect(authorWarnings(resolveScope(db, { author: "freebuff" }))).toEqual([]);
  });

  test("the briefing reports what begin declared, not the fallback it matched", async () => {
    const db = tempDb();
    dbs.push(db);
    beginSession(db, { project: "alpha", author: "freebuff" });

    // resolved without the declaration, the one remembered session is used,
    // which is exactly the case the deprecation warning is about
    const inherited = await briefing(db, fakeEmbedder());
    expect(inherited.author_warnings).toHaveLength(1);
    expect(inherited.author_source).toBe("active");

    const declared = await briefing(db, fakeEmbedder(), {
      declared: { project: "alpha", author: "freebuff" },
    });
    expect(declared.author_warnings).toEqual([]);
    expect(declared.author_source).toBe("declared");
    expect(declared.project).toBe("alpha");
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

    const result = await briefing(db, fakeEmbedder(), { since: watermark });
    // in scope, not mine, newest first
    expect(result.notices.map((n) => n.text)).toEqual(["no signature at all", "half done"]);
    expect(result.notices[0]?.work_id).toBe(item.id);
    expect(result.notices_since).toBe(watermark);
  });

  test("a first visit is handed the briefing, not the whole trail", async () => {
    const db = tempDb();
    dbs.push(db);
    const item = openWork(db, { title: "old thing", project: "alpha", author: "opencode" });
    noteWork(db, item.id, { text: "written before you existed", author: "opencode" });

    const result = await briefing(db, fakeEmbedder());
    expect(result.notices).toEqual([]);
    expect(result.notices_since).toBeNull();
    expect(result.author_warnings.length).toBeGreaterThan(0);
  });

  test("the briefing says who else is in the building, and which one is you", async () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    await Bun.sleep(5);
    setActive(db, { project: "beta", author: "opencode" });

    // a launcher that exports OFFICE_AUTHOR attributes correctly without
    // touching what the office remembers for anyone else
    const previous = process.env.OFFICE_AUTHOR;
    process.env.OFFICE_AUTHOR = "freebuff";
    try {
      const result = await briefing(db, fakeEmbedder());
      expect(result.sessions.map((s) => s.author)).toEqual(["opencode", "freebuff"]);
      expect(result.sessions.map((s) => s.is_you)).toEqual([false, true]);
      expect(result.author).toBe("freebuff");
      expect(result.project).toBe("alpha");
    } finally {
      if (previous === undefined) delete process.env.OFFICE_AUTHOR;
      else process.env.OFFICE_AUTHOR = previous;
    }
  });

  test("a bare begin does not leave a one-agent machine permanently ambiguous", async () => {
    const db = tempDb();
    dbs.push(db);
    beginSession(db, { project: "/p/alpha", author: "freebuff" });
    await Bun.sleep(5);
    // a caller that declared a project but never named itself
    beginSession(db, { project: "/p/beta", author: null });

    // the named session is untouched...
    expect(getSession(db, "freebuff")?.project).toBe("/p/alpha");
    expect(resolveScope(db, { author: "freebuff" }).project).toBe("/p/alpha");
    // ...and the undeclared caller has a slot of its own holding the project
    // it declared, rather than the machine resolving to nothing for good
    const scope = resolveScope(db);
    expect(scope.author).toBeNull();
    expect(scope.project).toBe("/p/beta");
    expect(scope.author_source).toBe("active");
    expect(authorWarnings(scope)[0]?.level).toBe("warn");
    expect(listSessions(db).map((s) => [s.author, s.project])).toEqual([
      [null, "/p/beta"],
      ["freebuff", "/p/alpha"],
    ]);
  });

  test("two agents that both decline to name themselves share one slot, and are told", () => {
    const db = tempDb();
    dbs.push(db);
    const first = beginSession(db, { project: "/p/alpha", author: null });
    const second = beginSession(db, { project: "/p/beta", author: null });

    expect(first.current?.project).toBe("/p/alpha");
    // nothing distinguishes them, so the office does not invent a second slot
    expect(listSessions(db)).toHaveLength(1);
    // the watermark is the caller's own row, so the second visit sees the first
    expect(second.previous?.project).toBe("/p/alpha");
    // and the shared slot says out loud that it is shared
    expect(authorWarnings(resolveScope(db))[0]?.text).toContain("unnamed slot");
  });

  test("a begin that does not restate the project keeps the one it had", () => {
    const db = tempDb();
    dbs.push(db);
    setActive(db, { project: "alpha", author: "freebuff" });
    setActive(db, { author: "freebuff" });

    expect(getSession(db, "freebuff")?.project).toBe("alpha");
    expect(resolveScope(db, { author: "freebuff" }).project).toBe("alpha");
  });
});
