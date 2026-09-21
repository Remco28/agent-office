import { afterEach, describe, expect, test } from "bun:test";
import { remember, searchDetailed } from "../src/memory";
import { groupedEmbedder, tempDb } from "./helpers";

describe("retrieval", () => {
  const dbs: ReturnType<typeof tempDb>[] = [];
  afterEach(() => {
    for (const db of dbs) db.close();
    dbs.length = 0;
  });

  async function seeded() {
    const db = tempDb();
    dbs.push(db);
    const embedder = groupedEmbedder();
    await remember(db, embedder, { content: "deploy notes for the release", project: "alpha" });
    await remember(db, embedder, { content: "organize the photo albums", project: "alpha" });
    return { db, embedder };
  }

  test("a meaning-only match clears the floor", async () => {
    const { db, embedder } = await seeded();
    // "ship it" never appears in the text; it only points at the same idea
    const result = await searchDetailed(db, embedder, "ship it", 8);
    expect(result.hits.map((h) => h.content)).toEqual(["deploy notes for the release"]);
    expect(result.hits[0].via).toBe("vector");
    expect(result.hits[0].similarity).toBe(1);
  });

  test("a question with no answer returns nothing, not near misses", async () => {
    const { db, embedder } = await seeded();
    const result = await searchDetailed(db, embedder, "quantum kumquat", 8);
    expect(result.hits).toEqual([]);
    expect(result.searched).toBe(2);
  });

  test("a question of only function words returns nothing", async () => {
    const { db, embedder } = await seeded();
    const result = await searchDetailed(db, embedder, "the and for", 8);
    expect(result.hits).toEqual([]);
  });

  test("word evidence survives the floor", async () => {
    const { db, embedder } = await seeded();
    await remember(db, embedder, { content: "checkout rate limit is 60/min", project: "alpha" });

    // on meaning alone this memory is orthogonal to the question, so it stays out
    const alone = await searchDetailed(db, embedder, "deploy", 8);
    expect(alone.hits.map((h) => h.content)).not.toContain("checkout rate limit is 60/min");

    // but naming a word that is in it brings it back
    const named = await searchDetailed(db, embedder, "deploy checkout", 8);
    const found = named.hits.find((h) => h.content.startsWith("checkout"));
    expect(found?.via).toBe("fts");
    expect(found?.similarity).toBe(0);
  });

  test("a project scope returns that project plus the everywhere notes", async () => {
    const { db, embedder } = await seeded();
    await remember(db, embedder, { content: "deploy conventions", project: "beta" });
    await remember(db, embedder, { content: "deploy habits", project: "alpha", scope: "global" });

    const scoped = await searchDetailed(db, embedder, "deploy", 8, { project: "alpha" });
    expect(scoped.scope).toBe("project");
    const contents = scoped.hits.map((h) => h.content);
    expect(contents).toContain("deploy notes for the release");
    expect(contents).toContain("deploy habits");
    expect(contents).not.toContain("deploy conventions");

    // global + this project's two notes are all that can ever come back
    expect(scoped.searched).toBe(3);
  });

  test("an unknown project does not filter anything", async () => {
    const { db, embedder } = await seeded();
    const result = await searchDetailed(db, embedder, "deploy", 8);
    expect(result.scope).toBe("all");
    expect(result.searched).toBe(2);
  });
});
