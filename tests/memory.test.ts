import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db";
import { fakeEmbedder } from "../src/embed";
import { forget, listMemories, remember, search } from "../src/memory";

function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), "agent-office-"));
  return openDb(join(dir, "memory.db"));
}

describe("memory", () => {
  const dbs: ReturnType<typeof openDb>[] = [];
  afterEach(() => {
    for (const db of dbs) db.close();
    dbs.length = 0;
  });

  test("remember and FTS search", async () => {
    const db = tempDb();
    dbs.push(db);
    const embedder = fakeEmbedder();
    await remember(db, embedder, {
      content: "Use WAL mode for the sqlite database.",
      tags: ["sqlite", "convention"],
      source: "test",
    });
    await remember(db, embedder, {
      content: "Never commit .env files.",
      tags: ["secrets"],
    });

    const hits = await search(db, embedder, "sqlite WAL", 5);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].content).toContain("WAL");
    expect(hits[0].tags).toContain("sqlite");
  });

  test("forget removes a memory", async () => {
    const db = tempDb();
    dbs.push(db);
    const embedder = fakeEmbedder();
    const row = await remember(db, embedder, { content: "temporary note" });
    expect(forget(db, row.id)).toBe(true);
    const hits = await search(db, embedder, "temporary note", 5);
    expect(hits.length).toBe(0);
    expect(listMemories(db)).toHaveLength(0);
  });

  test("empty query returns recent memories", async () => {
    const db = tempDb();
    dbs.push(db);
    const embedder = fakeEmbedder();
    await remember(db, embedder, { content: "first" });
    await remember(db, embedder, { content: "second" });
    const hits = await search(db, embedder, "", 8);
    expect(hits.map((h) => h.content)).toEqual(["second", "first"]);
  });

  test("rejects empty remember", async () => {
    const db = tempDb();
    dbs.push(db);
    await expect(remember(db, fakeEmbedder(), { content: "   " })).rejects.toThrow(
      "empty memory",
    );
  });
});
