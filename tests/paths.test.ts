import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dataDir, detectPython, logPath, pythonCandidates, recordedPythonPath } from "../src/paths";

const dirs: string[] = [];

function tempHome(): string {
  const dir = mkdtempSync(join(tmpdir(), "office-paths-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs.length = 0;
});

describe("paths", () => {
  test("no interpreter candidate comes from another machine", () => {
    // The list used to carry a hardcoded ~/<user>/.venv from the machine this
    // was first set up on. A path that only exists on one computer is the one
    // candidate that cannot help a new one.
    const candidates = pythonCandidates();
    expect(candidates.some((candidate) => candidate.includes("callum"))).toBe(false);
    expect(candidates.at(-1)).toBe("python3");
  });

  test("the interpreter an install recorded wins over the bare python3", () => {
    const home = tempHome();
    const previousHome = process.env.OFFICE_HOME;
    const previousPython = process.env.OFFICE_PYTHON;
    try {
      process.env.OFFICE_HOME = home;
      delete process.env.OFFICE_PYTHON;
      const fake = join(home, "python3");
      writeFileSync(fake, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
      writeFileSync(recordedPythonPath(), `${fake}\n`);

      expect(pythonCandidates()).toContain(fake);
      expect(detectPython()).toBe(fake);

      // A record pointing at something that no longer exists is skipped rather
      // than used, so a deleted venv degrades to the next candidate.
      rmSync(fake);
      expect(detectPython()).not.toBe(fake);
    } finally {
      if (previousHome === undefined) delete process.env.OFFICE_HOME;
      else process.env.OFFICE_HOME = previousHome;
      if (previousPython !== undefined) process.env.OFFICE_PYTHON = previousPython;
    }
  });

  test("no record, no env var: the list still ends in something runnable", () => {
    const home = tempHome();
    const previousHome = process.env.OFFICE_HOME;
    const previousPython = process.env.OFFICE_PYTHON;
    try {
      process.env.OFFICE_HOME = home;
      delete process.env.OFFICE_PYTHON;
      expect(pythonCandidates()).not.toContain(recordedPythonPath());
      expect(detectPython().length).toBeGreaterThan(0);
    } finally {
      if (previousHome === undefined) delete process.env.OFFICE_HOME;
      else process.env.OFFICE_HOME = previousHome;
      if (previousPython !== undefined) process.env.OFFICE_PYTHON = previousPython;
    }
  });

  test("the daemon log sits beside the store", () => {
    expect(logPath()).toBe(join(dataDir(), "office.log"));
  });
});
