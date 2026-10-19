import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listSkills } from "../src/skills";
import { briefing } from "../src/session";
import { ROOT } from "../src/paths";
import { tempDb } from "./helpers";

function skillsFolder(skills: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "agent-office-skills-"));
  for (const [folder, text] of Object.entries(skills)) {
    mkdirSync(join(dir, folder), { recursive: true });
    if (text) writeFileSync(join(dir, folder, "SKILL.md"), text);
  }
  return dir;
}

function skill(name: string, description: string, extra = ""): string {
  return `---\nname: ${name}\ndescription: ${description}\n${extra}---\n\n# ${name}\n`;
}

describe("skills", () => {
  test("lists every skill with its description and the file to read", () => {
    const dir = skillsFolder({
      "release-notes": skill("release-notes", "Write release notes from the git log."),
      deploy: skill("deploy", ">-\n  Ship the build\n  to production."),
    });
    const listing = listSkills(dir, "any-host");
    expect(listing.skills.map((s) => s.name)).toEqual(["deploy", "release-notes"]);
    expect(listing.skills[0].description).toBe("Ship the build to production.");
    expect(listing.skills[1].path).toBe(join(dir, "release-notes", "SKILL.md"));
    expect(listing.skills[1].machines).toBeNull();
    expect(listing.problems).toEqual([]);
  });

  test("a skill marked for another computer is counted, not listed", () => {
    const dir = skillsFolder({
      everywhere: skill("everywhere", "Applies on every computer."),
      "refurb-only": skill("refurb-only", "Restart the GPU box.", "metadata:\n  machine: Refurb\n"),
      "two-boxes": skill("two-boxes", "Either laptop.", "metadata:\n  machine: laptop, Refurb\n"),
    });
    const elsewhere = listSkills(dir, "laptop");
    expect(elsewhere.skills.map((s) => s.name)).toEqual(["everywhere", "two-boxes"]);
    expect(elsewhere.elsewhere).toBe(1);

    // Hostnames are matched without case.
    const there = listSkills(dir, "REFURB");
    expect(there.skills.map((s) => s.name)).toEqual(["everywhere", "refurb-only", "two-boxes"]);
    expect(there.skills[1].machines).toEqual(["refurb"]);
    expect(there.elsewhere).toBe(0);
  });

  test("a SKILL.md that cannot be read is named, not dropped quietly", () => {
    const dir = skillsFolder({
      empty: "",
      bare: "# no frontmatter\n",
      nodesc: skill("nodesc", '""'),
      renamed: skill("other-name", "Name disagrees with its folder."),
    });
    const listing = listSkills(dir, "host");
    const problems = Object.fromEntries(
      listing.problems.map((p) => [p.path.slice(dir.length + 1), p.problem]),
    );
    expect(problems).toEqual({
      empty: "folder has no SKILL.md",
      "bare/SKILL.md": "no YAML frontmatter between --- lines",
      "nodesc/SKILL.md": "frontmatter has no description",
      "renamed/SKILL.md": 'name "other-name" does not match its folder "renamed"',
    });
    // The misnamed skill still works; the problem is only reported.
    expect(listing.skills.map((s) => s.name)).toEqual(["other-name"]);
  });

  test("no skills folder is an empty listing, not an error", () => {
    expect(listSkills(join(tmpdir(), "agent-office-no-such-dir"), "host").skills).toEqual([]);
  });

  test("begin hands every session the skills, whatever its project", async () => {
    const db = tempDb();
    const dir = skillsFolder({ deploy: skill("deploy", "Ship it.") });
    const unscoped = await briefing(db, null, { skillsDir: dir });
    const scoped = await briefing(db, null, {
      skillsDir: dir,
      declared: { project: "/tmp/some-project", author: "tester" },
    });
    for (const brief of [unscoped, scoped]) {
      expect(brief.skills.map((s) => s.name)).toEqual(["deploy"]);
      expect(brief.skills_problems).toEqual([]);
    }
    db.close();
  });

  test("the checked-in skills all read cleanly", () => {
    const listing = listSkills(join(ROOT, "skills"), "any-host");
    expect(listing.problems).toEqual([]);
    expect(listing.skills.map((s) => s.name)).toContain("human-feedback");
  });
});
