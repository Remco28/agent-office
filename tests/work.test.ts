import { afterEach, describe, expect, test } from "bun:test";
import {
  closeWork,
  getWork,
  listWork,
  logChars,
  noteWork,
  openWork,
  openWorkCount,
  pruneLog,
} from "../src/work";
import { tempDb } from "./helpers";

describe("work log", () => {
  const dbs: ReturnType<typeof tempDb>[] = [];
  afterEach(() => {
    for (const db of dbs) db.close();
    dbs.length = 0;
  });

  test("done is derived from the trail, not stored", () => {
    const db = tempDb();
    dbs.push(db);
    const item = openWork(db, { title: "auth refactor", project: "alpha", author: "freebuff" });
    expect(item.closed).toBe(false);
    expect(listWork(db).map((w) => w.id)).toEqual([item.id]);

    noteWork(db, item.id, { text: "login.ts done, reset.ts next", author: "freebuff" });
    const open = listWork(db)[0];
    expect(open.last_note).toBe("login.ts done, reset.ts next");
    expect(open.closed).toBe(false);

    const closed = closeWork(db, item.id, { text: "finished", author: "freebuff" });
    expect(closed.closed).toBe(true);
    // the whole trail is still there: open, note, close
    expect(closed.events).toBe(3);
    expect(listWork(db)).toHaveLength(0);
    expect(listWork(db, { includeClosed: true })).toHaveLength(1);
    expect(openWorkCount(db)).toBe(0);
  });

  test("a CLI that stops mid-task leaves open work with a place to pick up", () => {
    const db = tempDb();
    dbs.push(db);
    const item = openWork(db, { title: "photo sort", project: "photos" });
    noteWork(db, item.id, { text: "halfway through 2023, rest untouched" });

    const open = listWork(db, { project: "photos" });
    expect(open).toHaveLength(1);
    expect(open[0].closed).toBe(false);
    expect(open[0].last_note).toBe("halfway through 2023, rest untouched");
    expect(openWorkCount(db)).toBe(1);
  });

  test("appending never rewrites what was already written", () => {
    const db = tempDb();
    dbs.push(db);
    const item = openWork(db, { title: "photos" });
    noteWork(db, item.id, { text: "halfway" });
    const trail = () =>
      db
        .query("SELECT kind, text FROM work_events WHERE work_id = ? ORDER BY id")
        .all(item.id) as { kind: string; text: string }[];
    const before = trail();
    closeWork(db, item.id);
    expect(trail().slice(0, 2)).toEqual(before);
    expect(trail()).toHaveLength(3);
  });

  test("notes and closes are refused once it is closed", () => {
    const db = tempDb();
    dbs.push(db);
    const item = openWork(db, { title: "photos" });
    closeWork(db, item.id);
    expect(() => noteWork(db, item.id, { text: "late" })).toThrow("already closed");
    expect(() => closeWork(db, item.id)).toThrow("already closed");
  });

  test("unknown work is an error, not a new item", () => {
    const db = tempDb();
    dbs.push(db);
    expect(() => noteWork(db, 999, { text: "x" })).toThrow("no work #999");
    expect(() => closeWork(db, 999)).toThrow("no work #999");
    expect(() => openWork(db, { title: "   " })).toThrow("needs a title");
    expect(getWork(db, 999)).toBeNull();
  });

  test("pruning drops the oldest closed work and never open work", () => {
    const db = tempDb();
    dbs.push(db);
    const first = openWork(db, { title: "old finished" });
    closeWork(db, first.id);
    const second = openWork(db, { title: "newer finished" });
    closeWork(db, second.id);
    const live = openWork(db, { title: "still open" });

    // one character over the cap frees exactly the oldest closed item
    expect(pruneLog(db, logChars(db) - 1)).toBe(1);
    expect(getWork(db, first.id)).toBeNull();
    expect(getWork(db, second.id)).not.toBeNull();

    expect(pruneLog(db, 1)).toBe(1);
    expect(getWork(db, second.id)).toBeNull();
    // open work is the handoff, so it survives every prune
    expect(getWork(db, live.id)).not.toBeNull();
  });

  test("the trail can be read for one project at a time", () => {
    const db = tempDb();
    dbs.push(db);
    openWork(db, { title: "alpha thing", project: "alpha" });
    openWork(db, { title: "beta thing", project: "beta" });
    expect(listWork(db, { project: "alpha" }).map((w) => w.title)).toEqual(["alpha thing"]);
    expect(listWork(db).map((w) => w.title).sort()).toEqual(["alpha thing", "beta thing"]);
    expect(listWork(db, { project: "gamma" })).toEqual([]);
  });
});
