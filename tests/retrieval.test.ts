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
    const result = await searchDetailed(db, embedder, "ship it", 8, { project: "alpha" });
    expect(result.hits.map((h) => h.content)).toEqual(["deploy notes for the release"]);
    expect(result.hits[0].via).toBe("vector");
    expect(result.hits[0].similarity).toBe(1);
  });

  test("a question with no answer returns nothing, not near misses", async () => {
    const { db, embedder } = await seeded();
    const result = await searchDetailed(db, embedder, "quantum kumquat", 8, { project: "alpha" });
    expect(result.hits).toEqual([]);
    expect(result.searched).toBe(2);
  });

  test("a question of only function words returns nothing", async () => {
    const { db, embedder } = await seeded();
    const result = await searchDetailed(db, embedder, "the and for", 8, { project: "alpha" });
    expect(result.hits).toEqual([]);
  });

  test("word evidence survives the floor", async () => {
    const { db, embedder } = await seeded();
    await remember(db, embedder, { content: "checkout rate limit is 60/min", project: "alpha" });

    // on meaning alone this memory is orthogonal to the question, so it stays out
    const alone = await searchDetailed(db, embedder, "deploy", 8, { project: "alpha" });
    expect(alone.hits.map((h) => h.content)).not.toContain("checkout rate limit is 60/min");

    // but naming a word that is in it brings it back
    const named = await searchDetailed(db, embedder, "deploy checkout", 8, { project: "alpha" });
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

  test("an unscoped read returns the everywhere notes and nothing else", async () => {
    const { db, embedder } = await seeded();
    // No project was declared, so both of alpha's notes are out of scope. The
    // answer is empty — never the rest of the store.
    const result = await searchDetailed(db, embedder, "deploy", 8);
    expect(result.scope).toBe("global");
    expect(result.searched).toBe(0);
    expect(result.hits).toEqual([]);

    await remember(db, embedder, { content: "deploy with the release script", scope: "global" });
    const everywhere = await searchDetailed(db, embedder, "deploy", 8);
    expect(everywhere.searched).toBe(1);
    expect(everywhere.hits.map((h) => h.content)).toEqual(["deploy with the release script"]);
  });

  test("naming a project the office has never heard of is empty, not everything", async () => {
    const { db, embedder } = await seeded();
    const result = await searchDetailed(db, embedder, "deploy", 8, { project: "gamma" });
    expect(result.scope).toBe("project");
    expect(result.searched).toBe(0);
    expect(result.hits).toEqual([]);
  });

  test("an unscoped recent-list is scoped the same way a search is", async () => {
    const { db, embedder } = await seeded();
    await remember(db, embedder, { content: "everywhere habit", scope: "global" });

    const result = await searchDetailed(db, embedder, "", 8);
    expect(result.hits.map((h) => h.content)).toEqual(["everywhere habit"]);
    expect(result.hits.every((h) => h.via === "recent")).toBe(true);
  });
});
