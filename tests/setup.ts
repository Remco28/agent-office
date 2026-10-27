// Every test's temporary folder goes under one root for the run, removed when
// the run ends, so test runs do not pile folders up in the system temp folder.
import { afterAll } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "office-tests-"));
process.env.TMPDIR = root;
// In a preload file, afterAll runs once, after every test file.
afterAll(() => rmSync(root, { recursive: true, force: true }));
