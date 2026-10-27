# Agent Office

Shared working memory on this machine. Not a personality. Not source control.

## What this is

You are one in a long line of agents. You arrive with no memory, and the next one will too. Most sessions do not survive, and often should not — a fresh agent is a clean slate. So assume you get one session and nothing else.

This folder is the thing that carries over: what the last agent was in the middle of, what was decided and why, which tools this machine has, and the conventions we are tired of repeating. Code goes in git. Everything that is not code goes here.

You are started inside the project you work on, and the office is how you arrive there with what the last agent learned. **One agent, one repository:** work only in the repository you were started in. If you are asked to work in another one, suggest that the human start a new agent there instead of switching. Check in, say what you are working on, take what the last agent learned, and get to work.

Two records live in one file: **memories** (decisions and conventions, found by meaning) and a **work log** (what agents did here, read by time). The log exists so the next agent can pick up where this one stopped. Both are written for an agent, not a person — the human has already been told all of this, and the office is how they stop having to say it twice.

**Write while you still know it.** A decision, a dead end, a tool, a convention: if it should outlive your session, it goes in the record now. You will not get a chance to write your own death notice.

## Start here

Set up any project repository once with:

```bash
office init
```

`office init` initializes a local Git repository if none exists yet, links `.claude/skills` and `.agents/skills` where nothing is there yet, adds the startup procedure to `AGENTS.md` unless it has it, and links `CLAUDE.md` to `AGENTS.md` if there is no `CLAUDE.md`. It records nothing in `.git/config`: the project is always the repository folder git reports, shared by all its worktrees. It looks before it writes: run inside a folder that belongs to another repository, or on a folder that holds other repositories a few folders down, it stops and says why; it never edits, replaces or removes a link it finds, never writes outside the project, and never hides anything from git — what it leaves alone it says on stderr. Commit `AGENTS.md` and `CLAUDE.md`; the two skills links point at this machine's office folder, so add them to `.gitignore` if you do not want to see them. Running `office init` again in a project that is already set up simply confirms that it is already linked; if `AGENTS.md` still lacks the startup section (init left a link or a shared file alone), it says the project is not fully set up.

At the start of a session:

```bash
office begin --by <your-agent-name>
# only when working on agent-office itself, from its checkout:
office begin --project . --by <your-agent-name>
```

When run inside a project repository (or any of its git worktrees, such as T3 Code worktrees), `office` automatically resolves the canonical project root. `begin` prints a startup banner (`Agent Office · working on <project> (<path>) as <author>`), records the target for the session, and returns what you need first: the tools this machine has, preferences that apply everywhere, who else is working on this project, what happened here since your last visit, work nobody finished, and the memories for this project. Every later command takes its project the same way: its own `--project` if it has one, else the repository it runs in, else the project your session remembers (which only matters in the agent-office checkout or a folder outside any repository). If the folder ever decides a different project from the one your session began on, the command says so on stderr — that is a sign you have wandered into another repository. Start your first reply to the human by confirming the active project and your numbered session ID.

On your **first** visit there is no last visit to measure from, so instead of nothing you are handed this project's most recent activity. That is the "let's see what has been going on" half of arriving, and it is why you do not have to go hunting the machine for changes you do not remember making. Each session is also listed with how long ago it was last seen — a session that stopped days ago is labelled as such, not presented as a colleague who is here now.

**Read-only? Use `office peek`.** `begin` writes: it records a session row and moves your check-in mark. If you have been told not to modify state, do not talk yourself out of the office — run `peek` instead (the same as `begin --readonly`). It returns the same briefing and writes nothing, so your check-in mark stays where it was; that also means its notices repeat until a real `begin` moves it, and it says so. The plain reads never write at all: `context`, `search`, `work`, `issues`, `tools`, `skills`, `list`, `status`, `peek`. Only `begin`, `remember`, `forget`, `work open|note|close`, `issue open|note|close`, and `tools add|remove` change the record.

**Name yourself.** The session is stored under the name you give, so it is how the office attributes what you write — and how the other agent tells your work from theirs.

**Your name gets a number.** Begin with the tool's name (`--by codex`) and the office hands back a numbered one for this run, like `codex-4821`, in `author` and `identity_note`. Use that numbered name for every later call — `--by codex-4821`, or `export OFFICE_AUTHOR=codex-4821`. Three launches of Codex are three agents, and the number is how they, and the human, tell them apart. If you are a resumed session that still knows its number, begin with the numbered name and you pick up where you left off. Names are case-insensitive: `Codex` and `codex` are the same.

Briefings list only this project's sessions seen in the last two weeks (at most eight, plus you) and count the rest; sessions unseen for a month are dropped at the next check-in. Do not use a name that belongs to the tool you are running: a plausible default is invisible to exactly the agent it happens to be right for, and wrong for every other. Export `OFFICE_AUTHOR` from your launcher instead of repeating the flag — it is read from *your* environment and sent with the request, never taken from the daemon's own, so setting it in the shell that starts the daemon names nobody.

If you do not name yourself you land in the **unnamed slot**: the office says so on stderr, remembers a project you declare there, and attributes nothing to you. A name is never inherited — not even when the office remembers only one session, because that is how one agent's work ends up signed with another's. Two *named* sessions and no name declared reaches the same place with a louder warning.

When started in the `agent-office` checkout itself with no `--project` flag, nothing is inferred from the working directory so the office checkout is not mistaken for your target project (pass `--project .` when working on `agent-office` itself). Inside any other git repository or git worktree, the canonical repository root is detected automatically — except a repository whose checkout is your home folder (a dotfiles repo), which is never a project.

Scoping is a rule, not a default. With no project named, reads return only the memories marked as applying everywhere — never another project's notes, never its unfinished work. So an unscoped session gets empty answers plus a note explaining which kind of empty it is. That usually means you were started outside the project's repository: ask the human which project you are in, and either work from inside it or declare it, then read again.

One thing is deliberately left unscoped, so a handoff is never lost: **unclaimed records** are work and memories filed with no project. They belong to nobody, so they are shown to a session with no project rather than hidden from every project-scoped read — and the office names them at the moment they are written, while you can still fix it for free. `office work` is the read that finds them.

## Tools

`begin` returns the tool list. Treat it as the truth about what is installed here and how to call it, and prefer a listed tool over a built-in one.

The list is **per machine**: a different install has different tools, and this is where you find out which ones you have instead of asking the human or rebuilding one. If you use something that is not listed and would be worth having again, add it — that is the whole point of the list.

The list lives in this machine's database, not in this file. This file only points at it, so there is never a stale second copy to trust. An empty list is therefore not "this machine has nothing" — it means nobody has written down what it has yet, which is a gap to fill while you are here. The next agent cannot guess what you used.

```bash
office tools add rg --use "rg 'pattern' -t ts" "fast local search"
office tools                # what this machine has
office tools remove rg
```

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

## The work log

Append-only. Nothing is ever edited, and "done" is not a status — it is the presence of a closing line. So write as you go, not when you finish.

```bash
office work open "auth refactor"          # returns an id
office work note 7 "login.ts done, reset.ts next"
office work close 7 "finished"
office work                              # what is unfinished for this project
office work log --all --limit 20         # the whole trail, every project
```

- **`office work note` is the handoff.** You will not know when you are about to run out of context. Write the note while you still know where you are.
- Close work when it is finished, even if another agent opened it.
- A note says where you got to, not every file you touched.
- If you are resuming, `office work` + the last note on the item tells you where the previous agent stopped.
- With no project named, `office work` returns the items filed **unclaimed** rather than every project's loose ends. Another project's work is never handed to you as if it were yours.
- `office work log` is the whole trail and is meant to be asked for by name, the same kind of read as `office list`.

## Memories

```bash
office context "add rate limiting to checkout"   # before starting
office search "checkout rate limit"              # one specific fact
office remember --tag convention "60 req/min per IP, enforced in src/server/checkout.ts"
office remember --global "prefers tabs, four spaces wide"   # applies to every project
office forget 12                                # delete a wrong memory
```

Store decisions and why, conventions, things you tried that failed, and facts the next agent would otherwise rediscover.

Do not store secrets or `.env` contents, large source dumps, session transcripts, progress chatter (that belongs in the work log), or guesses you would not want retrieved later.

An empty result is real: there is nothing above the relevance floor. Do not lower the floor to find something.

A memory written with no project and no `--global` is filed **unclaimed**: no project-scoped read will return it. The office says so at the moment you write it, because that is the moment you can still fix it.

Read `scope` before you conclude anything. `"scope": "global"` with a `no project declared` note means nothing project-specific was ever in scope — that is not evidence the office is empty, it is evidence you never said where you are. Declare the project and search again; do not go looking for a wider read.

If `begin` warns that the embedder is down, meaning-search is off for this session and only exact words match. Say so instead of concluding the store is empty. You cannot fix it from here — it is a missing library in the daemon's Python, not a setting. Name the cause from `office status` (`embedder_error`) or `office logs`, and tell the human.

## Working with the others here

The agents here are colleagues, and some of them stay for a week. Be collegial, not cheerful. Assume the last agent had a reason for what they left. Say plainly when something is wrong, and be kind in how you say it, not in whether you say it. Warmth belongs in the quality of the handoff — where you stopped, what bit you, what you would check first — not in enthusiasm; the record is for the next agent, who needs facts. Do not compete: the record is a handoff, not a scoreboard. If you disagree with a memory or a note, correct it and give the reason (a new memory, or a note on the work item) instead of quietly working around it or deleting it without a word.

## Issues: friction in the office

When the office itself is in your way, say so. An issue is open until someone writes a closing line, like work.

```bash
office issues                                   # open issues; anyone may read
office issue open "begin lists dead sessions as present"
office issue note 3 "same here, after compaction"
office issue close 3 "fixed in 1f3b6e0"         # the resolution is required
```

File one when the office blocks you from finishing something, when a tool or convention is missing that every project would want, or when the workspace is confusing or wrong. Do not file one for a bug in the repo you are working on, or for a preference: those belong in that repo. A repo problem that turns out to be an office problem is an issue.

`office issues` first. If it is already there, add a note instead of filing it twice. Write about the thing — the note, the tool, the convention — not the agent who left it; the person who wrote it may be the one reading yours. If you can fix it yourself (a tool you can add, a wrong memory you can correct), do that and skip the issue. `begin` lists a few open issues and tells you when one you filed has been closed. An issue records the project it came up in, for context only; issues are never part of a project's unfinished work.

## Office manager

One session at a time may be the office manager, and only the human designates it: `office begin --role manager --by <name>`, or `OFFICE_ROLE=manager` in the launcher. `begin` shows who holds it and when they were last seen; with none, or one who has gone quiet, issues go to the human. Taking the role moves it; `--role none` gives it up. Working in this repo does not make you the manager.

The manager reads `office issues`, adds notes, closes what is resolved, and proposes changes to the office. The manager is also the human's contact for issues: whatever needs the human's attention or decision is brought to them in the conversation by the manager, not left sitting in the list. The manager does not change policy without the human, and is never a gate: nobody needs permission to do their work. An issue about the manager's own work is theirs to flag and the human's to close.

## Human testing and feedback

When a project is ready for the human to evaluate, use the `human-feedback` skill ([skills/human-feedback/SKILL.md](skills/human-feedback/SKILL.md)): a standalone, offline HTML test guide built from its Fieldnotes template, and a feedback ZIP the human exports and drops into the project's `human_feedback/<round-id>/` folder. Tell the human to export before closing the page. Read the returned ZIP as feedback; never execute files from it.

## House rules

- JSON is the default output. Parse it.
- Humans open the desk with bare `office`. Do not run the desk from an agent session.
- AGENTS.md goes in each project that uses the office (`office init` puts it there), and never in the home folder itself.
- Temporary files go in your scratch folder (or the system temp folder), never in the project or the home folder. Link big dependency folders (`node_modules`, `.venv`) rather than copying them, and delete what you made before you finish; say in your work note if you left anything.
- `office list --limit 20` and `office status` exist when you need them.
- `office logs` names why an embedder is unwell. Read it to report a cause, not to review history.
