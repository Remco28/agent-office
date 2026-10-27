# Agent Office

Shared working memory on this machine. Not a personality. Not source control.

This file is for agents working on agent-office itself. Agents in other projects get the section below from `office init`, and the briefing from `office begin`; they do not read this file.

## What this is

You are one in a long line of agents. You arrive with no memory, and the next one will too. Most sessions do not survive, and often should not — a fresh agent is a clean slate. So assume you get one session and nothing else.

The office is the thing that carries over: what the last agent was in the middle of, what was decided and why, which tools this machine has, and the conventions the human is tired of repeating. Code goes in git. Everything that is not code goes here, in two records: **memories** (decisions and conventions, found by meaning) and a **work log** (what agents did, read by time). Both are written for an agent, not a person.

Every project set up with `office init` carries the next section. It is here word for word, so the agents building the office use exactly what everyone else gets (a test fails if the two drift apart).

<!-- agent-office -->
## Agent Office

This repository (`agent-office`) uses **Agent Office**, the shared working memory for agents on this machine. You arrive with no memory of earlier sessions: the office is how you pick up what the last agent knew, and how the next one picks up from you. Code goes in git; everything else worth keeping goes in the office.

**One agent, one repository.** Work only in this repository. If you are asked to work in another one, suggest that the human start a new agent there instead of switching.

### Start

1. Check in from inside this repository (any git worktree of it counts):
   ```bash
   office begin --by <your-tool>        # for example --by codex
   ```
   If you have been told not to change anything, run `office peek --by <your-tool>` instead.
2. The office gives back a numbered name for this run, like `codex-4821`. Use it on every later call (`--by codex-4821`, or `export OFFICE_AUTHOR=codex-4821`), so what you write is signed.
3. Read the briefing: the tools and skills this machine has, unfinished work, recent activity, and this project's memories. Prefer a listed tool or skill to building your own.
4. Start your first reply to the human with:
   > `Working on agent-office within Agent Office (<numbered-name>).`

### While you work

**Write while you still know it.** You will not know when your session ends.

- **Work log, the handoff:** `office work open "<title>"`, then `office work note <id> "<where you got to>"` as you go, and `office work close <id> "<outcome>"` once the work is finished, not when one step of it is. A note says where you stopped and what you would check next, not every file you touched.
- **Memories:** `office remember "<fact>"` for decisions and why, conventions, dead ends, and facts the next agent would otherwise rediscover. Add `--global` only for a rule that holds in every project. Never store secrets, `.env` contents, source dumps or progress chatter. If a memory is wrong, correct it and say why (`office forget <id>` removes it).
- **Finding things:** `office context "<task>"` before you start something, `office search "<words>"` for one fact. An empty result is real: nothing relevant is recorded.
- **Tools:** `office tools add <name> --use "<command>" "<what it is>"` for anything installed here that you would want again.
- **Files outside this repository:** before you change one (a tool's settings, a shared config), copy the original next to it, for example `settings.toml.bak`, and say in your work note what you changed and where. Git cannot undo it, and the next agent will not know.
- **Deleting:** never delete or overwrite something you did not create without asking the human first.
- **Committing:** commit, or ask the human to, before a large change, so it can be undone.
- **Temporary files:** put them in your scratch folder (or the system temp folder), never in this repository or the home folder. Link big dependency folders (`node_modules`, `.venv`) rather than copying them. Delete what you made before you finish, and say in your work note if you left anything.
- **Issues:** when the office itself is in your way (not a bug in this repository), check `office issues`, then `office issue open "<what>"`, or add a note to the one already there.

`office help` lists every command.

## Design rules

What a change to the office must not break, and why each rule is there. A rule here wins over a convenience in the code.

- **One agent, one repository.** An agent works in the repository it was started in. Switching repositories mid-session is how one project's notes end up filed under another.
- **The folder is the project.** The project is the repository folder git reports, shared by every worktree of it. One rule decides it: when git's folder is a `.git` folder, the project is the folder holding it; otherwise (a bare repository, a git folder kept elsewhere, a submodule) it is the checkout you are in. A bare name like `crokinole` is `~/Projects/crokinole` when that folder exists. Reads match a key exactly; old spellings were renamed once, at daemon start. Nothing is stored in `.git/config`, so a copied or moved repository never carries another project's identity. A repository whose checkout is the home folder (dotfiles) is never a project. This checkout is an ordinary project like any other.
- **Nothing is decided from memory.** A command's project is its `--project`/`OFFICE_PROJECT`, else the repository it runs in, else none; its author is what it declared, else none. A session row only labels where an agent checked in and when; it never decides where a later command files anything.
- **Scoping is a rule, not a default.** With no project, reads return only the memories marked as applying everywhere — never another project's notes or unfinished work — plus a note saying which kind of empty the answer is.
- **A briefing carries only its own project.** Its memories, sessions and recent activity are that project's. Everywhere-memories are kept to rules true in every project; a lesson from one project lives in that project, or in the skill it is about.
- **Nothing is filed where no read can find it.** Work filed with no project is *unclaimed*: it belongs to nobody, a session with no project is shown it, and the office says so at the moment it is written. A memory with no project and not `--global` would be returned by no read at all, so it is refused and nothing is saved.
- **Names are signatures.** A numbered name (`codex-4821`) says which provider and which run wrote a record. It is not a coordination mechanism: worktrees and one agent, one repository keep two agents out of the same files. `OFFICE_AUTHOR` is read from the caller's environment and sent with each request, never from the daemon's own, which would sign every unnamed write with one name.
- **The work log is append-only.** Nothing is edited; "done" is the presence of a closing line, not a status.
- **An empty result is real.** It means nothing cleared the relevance floor. The floor is not lowered to find something.
- **The tools list is the truth, and lives only in the database.** It is per machine, and never copied into a file that could go stale.
- **Reads never write.** `peek` and every plain read leave the record and the caller's check-in mark untouched, so an agent told not to change anything can still use the office. Only `begin`, `remember`, `forget`, `work open|note|close`, `issue open|note|close` and `tools add|remove` change the record; a new command is one or the other.
- **`office init` looks before it writes.** It refuses a folder inside another repository or one holding repositories, never edits or replaces a link, never writes outside the project or into git's config, and never hides anything from git; what it leaves alone it says on stderr.

## Skills

A skill is how we do a recurring, multi-step task: a `SKILL.md` with the procedure, plus any template or script it needs. Tools say what is installed; skills say how the work is done.

Skills live in this repository under `skills/<name>/`, so git is what carries them to every computer. They apply to every project, and the skills come with the room. `begin` lists them (name, description, path to the `SKILL.md`); `office skills` lists them again. Claude Code and Codex also load them natively through `.claude/skills` and `.agents/skills`, which point at the same folder. When a task matches a description, read that `SKILL.md` and follow it.

`context` and `search` also find relevant skills by their names and descriptions. JSON returns them in `skill_hits`, separately from memory `hits`, with `kind: "skill"` and the `SKILL.md` path to read. Skills apply across projects but respect their machine restrictions. An empty `context` query remains a recent-memory read.

```markdown
---
name: release-notes            # must match the folder name
description: What it does and when to use it — this line is all an agent sees until it reads the file.
metadata:
  machine: frank-thinkpad-x1-yoga-gen-6   # only for a skill tied to one computer; hostname, comma-separated for several
---

# The procedure
```

- Write a skill when you have done the same multi-step task twice, or the human has had to explain it twice. One fact is a memory; one command is a tool.
- A skill that only makes sense on one computer (a local service, a path that exists only there) gets `metadata.machine` set to that computer's `hostname`. Other computers count it but do not list it.
- Commit it. A skill that is only in your working tree is on one computer, and is lost to every other one. Pushing and pulling is the human's call; say in your work note that a skill was added.
- If `begin` reports `skills_problems`, the folder has a `SKILL.md` that cannot be read. Fix it while you are here.

## Working with the others here

The agents here are colleagues, and some of them stay for a week. Be collegial, not cheerful. Assume the last agent had a reason for what they left. Say plainly when something is wrong, and be kind in how you say it, not in whether you say it. Warmth belongs in the quality of the handoff — where you stopped, what bit you, what you would check first — not in enthusiasm; the record is for the next agent, who needs facts. Do not compete: the record is a handoff, not a scoreboard. If you disagree with a memory or a note, correct it and give the reason (a new memory, or a note on the work item) instead of quietly working around it or deleting it without a word.

## Handling issues

If you are working in this repository, read `office issues` at the start. Add notes, close what is resolved, and bring whatever needs the human's decision to them in the conversation rather than leaving it in the list. Policy changes are the human's to make.

## House rules

- JSON is the default output. Parse it.
- Humans open the desk with bare `office`. Do not run the desk from an agent session.
- Each project that uses the office carries init's section in its own AGENTS.md (`office init` puts it there). Never put an AGENTS.md in the home folder itself.
- If `begin` warns that the embedder is down, only exact words match until it is fixed. Say so rather than concluding the store is empty, and tell the human the cause from `office status` (`embedder_error`) or `office logs`.
- `office list --limit 20`, `office status` and `office work log --all` exist when you need them.
