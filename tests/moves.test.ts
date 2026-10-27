import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cpSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fakeEmbedder } from "../src/embed";
import { remember } from "../src/memory";
import { goneProjects, likelyMovedFrom, moveProject, recordProject } from "../src/moves";
import { briefing } from "../src/session";
import { closeWork, openWork } from "../src/work";
import { openIssue } from "../src/issues";
import { tempDb } from "./helpers";

const GIT_ENV = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };

function git(cwd: string, ...args: string[]) {
  const proc = Bun.spawnSync(["git", ...args], { cwd, env: GIT_ENV });
  if (proc.exitCode !== 0) throw new Error(proc.stderr.toString());
}

describe("moved and removed projects", () => {
  let root: string;
  let db: ReturnType<typeof tempDb>;
  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), "office-moves-")));
    db = tempDb();
  });
  afterEach(() => db.close());

  function repo(name: string, commit = true): string {
    const path = join(root, name);
    mkdirSync(path, { recursive: true });
    git(path, "init", "-q");
    if (commit) {
      writeFileSync(join(path, "README"), `${name}\n`);
      git(path, "add", "README");
      git(path, "commit", "-qm", "first");
    }
    return path;
  }

  async function notes(key: string) {
    await remember(db, fakeEmbedder(), { content: `a note in ${key}`, project: key });
    openWork(db, { title: `work in ${key}`, project: key });
  }

  test("a moved folder is recognised, and `move` brings every record over", async () => {
    const a = repo("app");
    recordProject(db, a);
    await notes(a);
    openIssue(db, { title: "an issue raised here", project: a });
    db.query("INSERT INTO session_state (author, project, updated_at) VALUES (?, ?, ?)").run("codex-1111", a, new Date().toISOString());
    const b = join(root, "app-renamed");
    renameSync(a, b);
    recordProject(db, b);

    expect(likelyMovedFrom(db, b)).toEqual([a]);
    const result = moveProject(db, a, b);
    expect(result).toEqual({ ok: true, moved: { memories: 1, work: 1, issues: 1, sessions: 1 } });
    for (const table of ["memories", "work", "issues", "session_state"]) {
      const keys = db.query(`SELECT DISTINCT project AS p FROM ${table}`).all() as { p: string }[];
      expect(keys.map((k) => k.p)).toEqual([b]);
    }
    // nothing points at the old folder any more, so nothing is listed as gone
    expect(goneProjects(db)).toEqual([]);
    expect(likelyMovedFrom(db, b)).toEqual([]);
  });

  test("the check-in note says so, and asks the human first; a read-only visit says nothing", async () => {
    const a = repo("app");
    recordProject(db, a);
    await notes(a);
    const b = join(root, "app-renamed");
    renameSync(a, b);
    recordProject(db, b);
    const begun = await briefing(db, fakeEmbedder(), { declared: { project: b } });
    expect(begun.scope_note).toContain(`shares its git history with ${a}, whose folder is gone`);
    expect(begun.scope_note).toContain("Tell the human");
    const peeked = await briefing(db, fakeEmbedder(), { declared: { project: b }, readonly: true });
    expect(peeked.scope_note ?? "").not.toContain("shares its git history");
  });

  test("a copy is its own project: nothing is suggested, and `move` refuses", async () => {
    const a = repo("app");
    recordProject(db, a);
    await notes(a);
    const c = join(root, "app-copy");
    cpSync(a, c, { recursive: true });
    recordProject(db, c);
    expect(likelyMovedFrom(db, c)).toEqual([]);
    const result = moveProject(db, a, c);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("still exists, so this is a copy");
  });

  test("a different history, or a project that already has notes, is refused, and nothing moves", async () => {
    const a = repo("app");
    recordProject(db, a);
    await notes(a);
    rmSync(a, { recursive: true });
    const other = repo("other");
    recordProject(db, other);
    expect(likelyMovedFrom(db, other)).toEqual([]);
    const different = moveProject(db, a, other);
    expect(!different.ok && different.reason).toContain("different git history");

    const busy = repo("busy");
    await notes(busy);
    const merge = moveProject(db, a, busy);
    expect(!merge.ok && merge.reason).toContain("already has notes of its own");
    expect((db.query("SELECT COUNT(*) n FROM memories WHERE project = ?").get(a) as { n: number }).n).toBe(1);
  });

  test("the destination must be a folder on this machine", async () => {
    const a = repo("app");
    await notes(a);
    rmSync(a, { recursive: true });
    const result = moveProject(db, a, "crokinol");
    expect(!result.ok && result.reason).toContain("not a folder on this machine");
    const file = join(root, "a-file");
    writeFileSync(file, "x\n");
    const onFile = moveProject(db, a, file);
    expect(!onFile.ok && onFile.reason).toContain("not a folder on this machine");
  });

  test("a project moved before fingerprints existed can still be moved, deliberately", async () => {
    const old = join(root, "moved-long-ago");
    await notes(old); // never existed here, never fingerprinted
    const now = repo("now-here");
    expect(moveProject(db, old, now).ok).toBe(true);
  });

  test("a repository with no commits yet records nothing, and is fingerprinted once it has one", () => {
    const empty = repo("empty", false);
    recordProject(db, empty);
    expect(db.query("SELECT COUNT(*) n FROM projects").get()).toEqual({ n: 0 });
    writeFileSync(join(empty, "x"), "x\n");
    git(empty, "add", "x");
    git(empty, "commit", "-qm", "first");
    recordProject(db, empty);
    expect((db.query("SELECT fingerprint FROM projects WHERE key = ?").get(empty) as { fingerprint: string }).fingerprint).toMatch(/^[0-9a-f]{40}$/);
  });

  test("a removed folder is listed with its records until it comes back; nothing is deleted", async () => {
    const a = repo("app");
    await notes(a);
    const away = join(root, "elsewhere");
    renameSync(a, away);
    expect(goneProjects(db)).toEqual([{ project: a, records: 2 }]);
    renameSync(away, a);
    expect(goneProjects(db)).toEqual([]);
    // once its work is all closed and it holds no memories, a removed project is finished history
    const finished = repo("finished");
    const item = openWork(db, { title: "done here", project: finished });
    closeWork(db, item.id, { text: "done" });
    rmSync(finished, { recursive: true });
    expect(goneProjects(db).map((g) => g.project)).not.toContain(finished);
    // and nothing was deleted along the way
    expect((db.query("SELECT COUNT(*) n FROM work").get() as { n: number }).n).toBe(2);
  });
});
