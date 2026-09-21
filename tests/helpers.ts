import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db";
import type { Embedder } from "../src/embed";

export function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), "agent-office-"));
  return openDb(join(dir, "memory.db"));
}

/** One axis per meaning group, plus one for "none of the above". */
const AXES = 4;
const OTHER = AXES;

/**
 * An embedder whose similarities are known exactly: text naming a word in a
 * group lands on that group's axis, so two spellings of the same idea are a
 * perfect match, different ideas are orthogonal, and anything outside the
 * groups is orthogonal to all of them.
 */
export function groupedEmbedder(
  groups: string[][] = [
    ["deploy", "release", "ship"],
    ["photo", "album", "picture"],
  ],
): Embedder {
  return {
    ready: true,
    dim: AXES + 1,
    async encode(text: string) {
      const lower = text.toLowerCase();
      const vector = new Float32Array(AXES + 1);
      let matched = false;
      groups.forEach((words, axis) => {
        if (words.some((word) => lower.includes(word))) {
          vector[axis] = 1;
          matched = true;
        }
      });
      if (!matched) vector[OTHER] = 1;
      return vector;
    },
    close() {},
  };
}
