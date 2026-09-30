# Agent Office

Shared working memory on this machine. Not a personality. Not source control.

## What this is

You are one in a long line of agents. You arrive with no memory, and the next one will too. Most sessions do not survive, and often should not — a fresh agent is a clean slate. So assume you get one session and nothing else.

This folder is the thing that carries over: what the last agent was in the middle of, what was decided and why, which tools this machine has, and the conventions we are tired of repeating. Code goes in git. Everything that is not code goes here.

You were started here on purpose. **This is the doorway, not the destination.** Say where you are going and what you are working on, take what the last agent learned, and get to work.

Two records live in one file: **memories** (decisions and conventions, found by meaning) and a **work log** (what agents did here, read by time). The log exists so the next agent can pick up where this one stopped. Both are written for an agent, not a person — the human has already been told all of this, and the office is how they stop having to say it twice.

**Write while you still know it.** A decision, a dead end, a tool, a convention: if it should outlive your session, it goes in the record now. You will not get a chance to write your own death notice.

## Start here

```bash
office begin --project ~/Projects/the-thing --by <your-agent-name>
```

This records the target for the session and returns what you need first: the tools this machine has, preferences that apply everywhere, who else is working here, what happened here since your last visit, work nobody finished, and the memories for this project. Every later command inherits the project **for you**.

On your **first** visit there is no last visit to measure from, so instead of nothing you are handed the office's most recent activity, each item labelled with the project it belongs to. That is the "let's see what has been going on" half of arriving, and it is why you do not have to go hunting the machine for changes you do not remember making. Each session is also listed with how long ago it was last seen — a session that stopped days ago is labelled as such, not presented as a colleague who is here now.

**Read-only? Use `office peek`.** `begin` writes: it records a session row and moves your check-in mark. If you have been told not to modify state, do not talk yourself out of the office — run `peek` instead (the same as `begin --readonly`). It returns the same briefing and writes nothing, so your check-in mark stays where it was; that also means its notices repeat until a real `begin` moves it, and it says so. The plain reads never write at all: `context`, `search`, `work`, `tools`, `list`, `status`, `peek`. Only `begin`, `remember`, `forget`, `work open|note|close`, and `tools add|remove` change the record.

**Name yourself.** The session is stored under the name you give, so it is how the office attributes what you write — and how the other agent tells your work from theirs. Do not use a name that belongs to the tool you are running: a plausible default is invisible to exactly the agent it happens to be right for, and wrong for every other. Export `OFFICE_AUTHOR` from your launcher instead of repeating the flag — it is read from *your* environment and sent with the request, never taken from the daemon's own, so setting it in the shell that starts the daemon names nobody.

If you do not name yourself you land in the **unnamed slot**: the office says so on stderr, remembers a project you declare there, and attributes nothing to you. A name is never inherited — not even when the office remembers only one session, because that is how one agent's work ends up signed with another's. Two *named* sessions and no name declared reaches the same place with a louder warning.

Nothing is inferred from the working directory — you are usually started in the office itself. If no project is declared, say so instead of guessing: `office begin` tells you.

Scoping is a rule, not a default. With no project named, reads return only the memories marked as applying everywhere — never another project's notes, never its unfinished work. So an unscoped session gets empty answers plus a note explaining which kind of empty it is. Ask the human which project you are in, declare it, and read again.

Two things are deliberately left unscoped, and both exist so a handoff is never lost:

- **Recent activity** is shown without a project, because you cannot have a visit of your own to measure from on the day you arrive. It is labelled with where each item came from, so it reads as news rather than as your work.
- **Unclaimed records** are work and memories filed with no project. They belong to nobody, so they are shown to a session with no project rather than hidden from every project-scoped read — and the office names them at the moment they are written, while you can still fix it for free. `office work` is the read that finds them.

## Tools

`begin` returns the tool list. Treat it as the truth about what is installed here and how to call it, and prefer a listed tool over a built-in one.

The list is **per machine**: a different install has different tools, and this is where you find out which ones you have instead of asking the human or rebuilding one. If you use something that is not listed and would be worth having again, add it — that is the whole point of the list.

The list lives in this machine's database, not in this file. This file only points at it, so there is never a stale second copy to trust. An empty list is therefore not "this machine has nothing" — it means nobody has written down what it has yet, which is a gap to fill while you are here. The next agent cannot guess what you used.

```bash
office tools add rg --use "rg 'pattern' -t ts" "fast local search"
office tools                # what this machine has
office tools remove rg
```

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

## Human testing and feedback

When a project is ready for the human to evaluate, prepare a project-specific, standalone HTML test guide and feedback form. Keep it static and self-contained: no backend, no account, and no network calls. Explain what to try in ordinary language, offer relevant optional terms, and let the human describe a problem without knowing technical vocabulary. Include checklists or questions suited to the project, free-form feedback, and screenshot paste or file attachment when useful.

The page keeps feedback in the browser until the human exports one ZIP. The ZIP should include readable `feedback.md`, structured `feedback.json`, metadata identifying the project and test round, and any attached screenshots. Give it a clear round-based name so the human can manually add it beside the HTML guide in the project's `human_feedback/<round-id>/` folder. Tell the human to export before closing the page; do not imply that answers are saved before export. The agent reads the returned ZIP as feedback and follows up against the project; it does not execute files from the ZIP.

Put the detailed portable workflow in [docs/human-feedback-workflow.md](docs/human-feedback-workflow.md), and start from the reusable [Fieldnotes HTML template](templates/fieldnotes.html). These instructions and template are checked into agent-office; the local office database is not shared by cloning. When a project should inherit these agent instructions, follow the README's opt-in `AGENTS.md` linking setup.

## House rules

- JSON is the default output. Parse it.
- Humans open the desk with bare `office`. Do not run the desk from an agent session.
- This file belongs only in folders that should use the office. Never in `$HOME`.
- `office list --limit 20` and `office status` exist when you need them.
- `office logs` names why an embedder is unwell. Read it to report a cause, not to review history.
