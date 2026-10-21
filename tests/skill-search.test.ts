import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createSkillSearch } from "../src/skill-search";
import { groupedEmbedder } from "./helpers";

describe("skill discovery", () => {
  const dirs: string[] = [];
  function folder() {
    const dir = mkdtempSync(join(tmpdir(), "office-discovery-"));
    dirs.push(dir);
    return dir;
  }
  function write(dir: string, name: string, description: string, machine?: string) {
    mkdirSync(join(dir, name), { recursive: true });
    writeFileSync(join(dir, name, "SKILL.md"), `---\nname: ${name}\ndescription: ${description}\n${machine ? `metadata:\n  machine: ${machine}\n` : ""}---\n`);
  }
  afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

  test("semantic matches clear the floor; unrelated and function-only queries return nothing", async () => {
    const dir = folder();
    write(dir, "desktop-polish", "Make apps polished.");
    const search = createSkillSearch(groupedEmbedder([["beautiful", "polished"]]));
    expect((await search(dir, "beautiful")).skill_hits[0].via).toBe("vector");
    expect((await search(dir, "volcano")).skill_hits).toEqual([]);
    expect((await search(dir, "the and for")).skill_hits).toEqual([]);
    expect((await search(dir, "")).skill_hits).toEqual([]);
  });

  test("word matching survives an unavailable or failing embedder", async () => {
    const dir = folder();
    write(dir, "desktop-polish", "Make apps polished.");
    const broken = groupedEmbedder();
    broken.encode = async () => { throw new Error("sidecar down"); };
    for (const embedder of [null, broken]) {
      const result = await createSkillSearch(embedder)(dir, "desktop-polish");
      expect(result.skill_hits[0]).toMatchObject({ name: "desktop-polish", via: "words", similarity: null });
    }
  });

  test("metadata edits and deletions invalidate cached vectors, and newly ready embedders work", async () => {
    const dir = folder();
    write(dir, "design", "Make apps polished.");
    const embedder = groupedEmbedder([["beautiful", "polished"], ["release", "ship"]]);
    const encode = embedder.encode;
    let calls = 0;
    embedder.encode = async (text) => { calls++; return encode(text); };
    const search = createSkillSearch(embedder);
    embedder.ready = false;
    expect((await search(dir, "beautiful")).skill_hits).toEqual([]);
    embedder.ready = true;
    expect((await search(dir, "beautiful")).skill_hits).toHaveLength(1);
    expect(calls).toBe(2);
    await search(dir, "beautiful");
    expect(calls).toBe(3); // Only the query is encoded again.
    write(dir, "design", "Ship the release.");
    expect((await search(dir, "beautiful")).skill_hits).toEqual([]);
    expect((await search(dir, "release")).skill_hits[0].description).toBe("Ship the release.");
    rmSync(join(dir, "design"), { recursive: true });
    expect((await search(dir, "release")).skill_hits).toEqual([]);
  });

  test("machine filters, problems and result limits follow the live folder", async () => {
    const dir = folder();
    write(dir, "one", "Polished apps.");
    write(dir, "two", "Polished apps.");
    write(dir, "remote", "Polished apps.", "another-host-that-is-not-this-one");
    mkdirSync(join(dir, "broken"));
    const result = await createSkillSearch(null)(dir, "polished", 1);
    expect(result.skills_searched).toBe(2);
    expect(result.skill_hits).toHaveLength(1);
    expect(result.skill_hits[0].name).not.toBe("remote");
    expect(result.skills_problems).toHaveLength(1);
  });
});
