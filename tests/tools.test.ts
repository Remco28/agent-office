import { afterEach, describe, expect, test } from "bun:test";
import { countTools, getTool, listTools, removeTool, upsertTool } from "../src/tools";
import { tempDb } from "./helpers";

describe("tools", () => {
  const dbs: ReturnType<typeof tempDb>[] = [];
  afterEach(() => {
    for (const db of dbs) db.close();
    dbs.length = 0;
  });

  test("adding the same tool again updates it in place", () => {
    const db = tempDb();
    dbs.push(db);
    upsertTool(db, { name: "RG", summary: "local search", usage: "rg -t ts" });
    const updated = upsertTool(db, { name: "rg", summary: "ripgrep, fast local search" });

    expect(updated.name).toBe("rg");
    expect(listTools(db)).toHaveLength(1);
    expect(countTools(db)).toBe(1);
    expect(updated.summary).toBe("ripgrep, fast local search");
    // usage was omitted this time, so the previous value stays
    expect(updated.usage).toBe("rg -t ts");
  });

  test("notes can be corrected without restating the summary", () => {
    const db = tempDb();
    dbs.push(db);
    upsertTool(db, { name: "office", summary: "the local memory CLI", notes: "old note" });
    upsertTool(db, { name: "office", summary: "the local memory CLI", notes: "prefer it over guessing" });
    expect(getTool(db, "office")?.notes).toBe("prefer it over guessing");
  });

  test("requires a name and a summary", () => {
    const db = tempDb();
    dbs.push(db);
    expect(() => upsertTool(db, { name: "  ", summary: "x" })).toThrow("needs a name");
    expect(() => upsertTool(db, { name: "rg", summary: "  " })).toThrow("needs a summary");
  });

  test("remove reports whether anything went", () => {
    const db = tempDb();
    dbs.push(db);
    upsertTool(db, { name: "rg", summary: "local search" });
    expect(removeTool(db, "RG")).toBe(true);
    expect(removeTool(db, "rg")).toBe(false);
    expect(listTools(db)).toEqual([]);
  });
});
