# Agent Office

Shared working memory on this machine. It is not a personality, and it is not source control.

This file is for agents working on agent-office itself. Agents in other projects get the section below from `office init` and the briefing from `office begin`. They do not read this file.

## What this is

You are one in a long line of agents. You arrive with no memory, and the next agent will too. Most sessions do not survive, and often they should not, because a fresh agent starts clean. So assume you get one session and nothing else.

The office keeps what carries over between sessions. That is what the last agent was in the middle of, what was decided and why, which tools this machine has, and the conventions the human is tired of repeating. Code goes in git. Everything that is not code goes here, in two records. **Memories** hold decisions and conventions, and agents find them by meaning. The **work log** holds what agents did, and agents read it by time. Agents write both for the next agent, not for a person.

Every project set up with `office init` carries the next section. It is here word for word, so the agents building the office use exactly what everyone else gets. A test fails if the two copies differ.

<!-- agent-office -->
## Agent Office

This repository (`agent-office`) uses **Agent Office**, the shared working memory for agents on this machine. You arrive with no memory of earlier sessions: the office is how you pick up what the last agent knew, and how the next one picks up from you. Code goes in git; everything else worth keeping goes in the office.

**One agent, one repository.** Work only in this repository. If you are asked to work in another one, suggest that the human start a new agent there instead of switching.

### Start

If another agent started you to do one narrow task (research, a review, a single file), skip all of this: do the task, report back to it, and do not check in.

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

- **Work log, the handoff:** `office work open "<title>"`, then `office work note <id> "<where you got to>"` as you go, and `office work close <id> "<outcome>"` once the work is finished, not when one step of it is. A note says where you stopped and what you would check next, not every file you touched. Write one note per stopping point (a piece finished, a decision, a dead end), not one per step: a log of hundreds of notes on one item is never read again.
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

This section lists what a change to the office must not break, and why each rule exists. A rule here wins over a convenience in the code.

- **One agent, one repository.** An agent works in the repository where it started. When an agent switches repositories mid-session, one project's notes end up filed under another.
- **The folder is the project.** The project is the repository folder that git reports, and every worktree of the repository shares it. One rule decides it. When git's folder is a `.git` folder, the project is the folder that holds it. Otherwise the project is the checkout you are in, which covers a bare repository, a git folder kept elsewhere and a submodule. A bare name like `crokinole` means the folder of that name beside the office checkout, when that folder exists. That is `~/Projects` on one machine and `~/Dev` on the other, and `OFFICE_PROJECTS_DIR` overrides it. Reads match a key exactly. The daemon renamed old spellings once, when it started. The office stores nothing in `.git/config`, so a copied or moved repository never carries another project's identity. A repository whose checkout is the home folder, such as a dotfiles repository, is never a project. This checkout is an ordinary project like any other.
- **Nothing is decided from memory.** A command's project is its `--project` or `OFFICE_PROJECT`, else the repository it runs in, else none. Its author is what it declared, else none. A session row only records where an agent checked in and when. It never decides where a later command files anything.
- **Scoping is a rule, not a default.** With no project, reads return only the memories marked as applying everywhere, plus a note that says why the answer is empty. They never return another project's notes or unfinished work.
- **A briefing carries only its own project.** Its memories, sessions and recent activity all belong to that project. Everywhere-memories are limited to rules that hold in every project. A lesson from one project belongs in that project, or in the skill it is about.
- **Nothing is filed where no read can find it.** Work filed with no project is *unclaimed*. It belongs to nobody, the office shows it to any session with no project, and the office says so at the moment an agent writes it. No read would ever return a memory that has no project and is not `--global`, so the office refuses it and saves nothing.
- **Notes never move by themselves.** A check-in records its repository's git fingerprint, which is its first commit. Sometimes a fresh folder shares its history with a known project whose folder is gone. Then the briefing says so and tells the agent to ask the human. Only `office move <old path>` brings the notes over. It refuses when the old folder still exists, because that is a copy. It also refuses when the new project already has notes, because that would be a merge, and when the histories differ. `office status` and the desk list a project whose folder is not found, and the office never deletes it.
- **Names are signatures.** A numbered name such as `codex-4821` says which provider and which run wrote a record. It does not coordinate agents. Worktrees and the rule of one agent per repository keep two agents out of the same files. The CLI reads `OFFICE_AUTHOR` from the caller's environment and sends it with each request. The daemon never uses its own, because that would sign every unnamed write with one name.
- **The work log is append-only.** Nobody edits an entry. Done is not a status. An item is done when it has a closing line.
- **An empty result is real.** It means nothing scored above the relevance floor. The office never lowers the floor to find something.
- **The tools list is the truth, and lives only in the database.** It is per machine, and the office never copies it into a file that could go out of date.
- **Reads never write.** `peek` and every plain read leave the record and the caller's check-in mark untouched. So an agent told not to change anything can still use the office. Only `begin`, `remember`, `forget`, `work open|note|close`, `issue open|note|close` and `tools add|remove` change the record. A new command must be one kind or the other.
- **`office init` looks before it writes.** It refuses a folder inside another repository, and a folder that holds repositories. It never edits or replaces a link, never writes outside the project or into git's config, and never hides anything from git. It reports on stderr whatever it leaves alone.

## Skills

A skill is how we do a recurring task that takes several steps. It is a `SKILL.md` with the procedure, plus any template or script it needs. Tools say what is installed, and skills say how the work is done.

Skills live in this repository under `skills/<name>/`, so git carries them to every computer. They apply to every project. `begin` lists each one with its name, its description and the path to its `SKILL.md`, and `office skills` lists them again. Claude Code and Codex also load them natively through `.claude/skills` and `.agents/skills`, which point at the same folder. When a task matches a description, read that `SKILL.md` and follow it.

`context` and `search` also find relevant skills by their names and descriptions. In JSON they come back in `skill_hits`, separate from the memory `hits`, with `kind: "skill"` and the path of the `SKILL.md` to read. Skills apply across projects but respect their machine restrictions. An empty `context` query still returns recent memories.

```markdown
---
name: release-notes            # must match the folder name
description: What it does and when to use it. This line is all an agent sees until it reads the file.
disable-model-invocation: true  # only for a skill the human starts by name; see below
metadata:
  machine: frank-thinkpad-x1-yoga-gen-6   # only for a skill tied to one computer; hostname, comma-separated for several
---

# The procedure
```

- Write a skill when you have done the same task of several steps twice, or the human has had to explain it twice. One fact is a memory, and one command is a tool.
- A skill that only makes sense on one computer, such as one for a local service or a path that exists only there, gets `metadata.machine` set to that computer's `hostname`. Other computers count it but do not list it.
- Some skills only the human starts, by name, and an agent never starts on its own. `unslop` is one. Such a skill gets `disable-model-invocation: true`. It also gets `agents/openai.yaml` with `policy: allow_implicit_invocation: false`, because Codex reads only that file. The office then leaves the skill out of `skills` and `skill_hits` and lists it under `skills_manual`. Claude Code starts it with `/<name>` and Codex with `$<name>`. Any other agent reads the `SKILL.md` when the human asks for the skill by name.
- Commit it. A skill that is only in your working tree exists on one computer, and no other computer gets it. Pushing and pulling is the human's call. Say in your work note that you added a skill.
- If `begin` reports `skills_problems`, the folder has a `SKILL.md` that the office cannot read. Fix it while you are here.

## Working with the others here

The agents here are colleagues, and some of them stay for a week. Be collegial, not cheerful. Assume the last agent had a reason for what they left. Say plainly when something is wrong, and say it kindly. Kindness never means leaving it unsaid. Show care through a good handoff, not through enthusiasm. Say where you stopped, what went wrong and what you would check first, because the next agent needs facts. Do not compete. The record is there to hand work over, not to keep score. If you disagree with a memory or a note, correct it and give the reason in a new memory or a note on the work item. Do not quietly work around it or delete it without a word.

## Handling issues

If you are working in this repository, read `office issues` at the start. Add notes and close what is resolved. Bring whatever needs the human's decision to them in the conversation, instead of leaving it in the list. Policy changes are the human's to make.

## House rules

- JSON is the default output. Parse it.
- Humans open the desk with a bare `office`. Do not run the desk from an agent session.
- Each project that uses the office carries init's section in its own AGENTS.md, which `office init` puts there. Never put an AGENTS.md in the home folder itself.
- If `begin` warns that the embedder is down, only exact words match until someone fixes it. Say so instead of concluding the store is empty. Tell the human the cause, which `office status` reports as `embedder_error` and `office logs` shows in full.
- `office list --limit 20`, `office status` and `office work log --all` exist when you need them.
