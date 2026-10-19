import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";

/**
 * Skills are files in this repository, not rows in the database: a skill is a
 * procedure with its own scripts and templates, it should be reviewed like
 * code, and git is what carries it to every computer. The office only reads
 * the folder, so there is never a second copy to go stale.
 *
 * The format is the one Claude Code and Codex already load natively
 * (`skills/<name>/SKILL.md`, YAML frontmatter with `name` and `description`),
 * so the same folder serves the agents that load skills themselves and, via
 * the briefing, the ones that do not.
 */
export type Skill = {
  name: string;
  description: string;
  /** Absolute path to SKILL.md: read it when the task matches. */
  path: string;
  /** Hostnames this skill is for, or null when it applies on every computer. */
  machines: string[] | null;
};

export type SkillProblem = { path: string; problem: string };

export type SkillListing = {
  /** Skills for this computer: every unmarked one, plus those marked for it. */
  skills: Skill[];
  /** Skills marked for other computers, counted rather than listed. */
  elsewhere: number;
  /** SKILL.md files that could not be read, named so they get fixed. */
  problems: SkillProblem[];
  host: string;
};

export function thisMachine(): string {
  return process.env.OFFICE_MACHINE?.trim() || hostname();
}

/**
 * `metadata.machine` marks a skill as belonging to particular computers: one
 * hostname, or several separated by commas. It lives under `metadata` because
 * that is the frontmatter key the skill format sets aside for anything else,
 * so the native loaders accept the file unchanged.
 */
function machinesOf(meta: unknown): string[] | null {
  if (!meta || typeof meta !== "object") return null;
  const raw = (meta as Record<string, unknown>).machine;
  if (raw === undefined || raw === null) return null;
  const list = (Array.isArray(raw) ? raw : String(raw).split(","))
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
  return list.length ? list : null;
}

function frontmatter(text: string): Record<string, unknown> | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return null;
  const parsed = Bun.YAML.parse(match[1]);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

export function readSkill(dir: string): Skill {
  const path = join(dir, "SKILL.md");
  const data = frontmatter(readFileSync(path, "utf8"));
  if (!data) throw new Error("no YAML frontmatter between --- lines");
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : "";
  if (!name) throw new Error("frontmatter has no name");
  if (!description) throw new Error("frontmatter has no description");
  return { name, description, path, machines: machinesOf(data.metadata) };
}

export function listSkills(dir: string, host: string = thisMachine()): SkillListing {
  const listing: SkillListing = { skills: [], elsewhere: 0, problems: [], host };
  if (!existsSync(dir)) return listing;
  const here = host.toLowerCase();
  for (const entry of readdirSync(dir).sort()) {
    const folder = join(dir, entry);
    if (entry.startsWith(".") || !statSync(folder).isDirectory()) continue;
    if (!existsSync(join(folder, "SKILL.md"))) {
      listing.problems.push({ path: folder, problem: "folder has no SKILL.md" });
      continue;
    }
    let skill: Skill;
    try {
      skill = readSkill(folder);
    } catch (err) {
      listing.problems.push({
        path: join(folder, "SKILL.md"),
        problem: err instanceof Error ? err.message : String(err),
      });
      continue;
    }
    if (skill.name !== entry) {
      // The native loaders key a skill by its folder; a name that disagrees is
      // two names for one thing, and the next agent will search for the wrong one.
      listing.problems.push({
        path: skill.path,
        problem: `name "${skill.name}" does not match its folder "${entry}"`,
      });
    }
    if (skill.machines && !skill.machines.includes(here)) listing.elsewhere += 1;
    else listing.skills.push(skill);
  }
  return listing;
}
