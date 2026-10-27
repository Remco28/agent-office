# agent-office

Local working memory for standalone coding agents.

One SQLite file, a localhost daemon, and a CLI. It holds two records:

- **memories** — decided facts, conventions, pitfalls. Curated, searched by meaning (FTS5 + MiniLM embeddings), correctable.
- **work log** — an append-only trail of what agents have done. Read by time, never edited.

No identity layer, no account, no cloud. Not source control: code is git, memory is this file.

## Why

Coding agents start with no memory. Providers rarely let a session survive, and often it is better that it does not — a fresh agent is a clean slate. So every agent arrives not knowing what the last one was in the middle of, what was decided and why, which tools this machine has, or which conventions we keep repeating. Git holds the code, and none of that.

**You start every agent inside the project it works on.** Set the project up once with `office init`, and from then on an agent started in that repository — or any git worktree of it — checks in, is told which project it is in by the folder, takes what the last agent learned, and gets to work. One agent works in one repository: to work on another, start another agent there.

That is also how a human stops repeating themselves. Describe a tool or a convention once, here, and no later agent has to be told again. The record is written for the next agent, not for you: it is the version of "I already said this" that survives the session that heard it.

Memory is per machine. A different install has different tools, and the store does not sync — see [Copying the store](#copying-the-store) for the deliberate fork.

## Requirements

- [Bun](https://bun.sh)
- Python 3 — the installer builds a virtualenv with sentence-transformers, and downloads MiniLM into it on first use

Budget ~1.4 GB for that virtualenv where there is no NVIDIA GPU (the CPU build of PyTorch), or ~5 GB where the CUDA build is installed. Word-matching search works without any of it; meaning-matching does not.

## Setup on a machine

Code is git. Memory is not. Clone on each computer, run the installer, leave the database where it is. Each machine has its own filing cabinet — nothing syncs, and the installer never touches the store.

The daemon binds `127.0.0.1:7701`. Data lives in `~/.local/share/agent-office/memory.db`, outside the git repo.

### A machine with nothing on it

```bash
git clone git@github.com:Remco28/agent-office.git ~/Projects/agent-office   # wherever you keep checkouts
cd ~/Projects/agent-office
./install.sh --verify
```

`install.sh` runs `bun install`, builds `./.venv`, symlinks `office` into `~/.local/bin`, and `--verify` starts the daemon and proves meaning-search came up. The first query downloads MiniLM, so that step needs network once.

On a machine with no NVIDIA GPU it takes the **CPU build of PyTorch** rather than the default Linux wheel, which is the CUDA one: about 1.4 GB of venv instead of 5 GB, for a GPU this laptop does not have. `install.sh` decides that itself.

### What breaks on a new machine

Four things went wrong the second time this was set up. All four are handled by `install.sh` now, but they are worth knowing by name:

| Symptom | Cause | Fix |
|---|---|---|
| `office` works in your terminal, dies under an agent | bun's installer writes its PATH export to the end of `~/.bashrc`, past the "if not running interactively" guard, so agent shells never see `~/.bun/bin` | `install.sh` links bun into `~/.local/bin`; `bin/office` also falls back to the install locations rather than trusting PATH |
| `embedder: false`, no reason anywhere | a detached daemon used to discard its own stderr, and the sidecar's failure is written there | the daemon's output now goes to `~/.local/share/agent-office/office.log`; `office status` carries `embedder_error`, the desk quotes it, `office logs` shows the rest |
| the venv build fails or installs nothing usable | the system `python3` was newer than the PyTorch wheel chain | build with an older interpreter: `OFFICE_PYTHON_BUILD=~/.local/share/uv/python/cpython-3.12*/bin/python3 ./install.sh` |
| ~5 GB of venv on a laptop with no NVIDIA GPU | pip takes the CUDA build of torch by default on Linux | `install.sh` uses the CPU index when `nvidia-smi` finds nothing |

If `office status` reports `"embedder": false`, search still works but only matches words. Expect it in three places:

| where | what you see |
|---|---|
| `office status` | `"embedder": false`, plus `embedder_error` and the `python` it tried |
| desk (bare `office`) | `Embedder  down`, and a warning line quoting the sidecar |
| `office logs` | the daemon's own output — `office embedder: No module named torch` |
| `~/.local/share/agent-office/office.log` | the same file `office logs` reads |

### A machine that already has sentence-transformers

If some Python on that machine can already import it, do not build a second 5 GB venv. Confirm the interpreter first — the model has to be in *this* one:

```bash
/path/to/python3 -c "import sentence_transformers; print('ok')"
```

Then skip the venv and point the office at it:

```bash
SKIP_VENV=1 ./install.sh
export OFFICE_PYTHON=/path/to/python3
office stop && office serve --detach
office status
```

`OFFICE_PYTHON` has to be in the environment of whatever starts the daemon, because the daemon inherits that environment — passing it to `install.sh` alone does nothing. Put the `export` in your shell profile if you want it to stick, and restart the daemon after changing it, since a running one keeps the interpreter it started with. `OFFICE_MODEL` works the same way if that machine has a different embedding model cached.

### How it picks a Python

In order, and the first one that exists wins:

1. `OFFICE_PYTHON` — explicit, and the only one that works from a process that was started with it in its environment
2. the interpreter `install.sh` recorded in `~/.local/share/agent-office/python` — what it verified on *this* machine
3. `./.venv/bin/python3` — what `install.sh` builds
4. `python3` on `PATH` — only works if that interpreter already has sentence-transformers

So on a new machine it is one of two things: let `install.sh` build `./.venv`, or set `OFFICE_PYTHON` to a Python that has the library. Case 4 is the trap — a bare `python3` without sentence-transformers looks exactly like a broken install.

Keeping the record in the data directory rather than the checkout means the venv can live outside the repo (safe from `git clean -xfd`) without an env var in every shell. `office status` reports the interpreter in use as `python`, so which one it picked is never a guess.

### Updating an existing machine

```bash
git pull
./install.sh
```

## Starting a session

```bash
cd ~/Projects/the-thing && office init     # once per project
office begin --by <your-agent-name>          # from inside the project, every session
```

That records the target for the session and returns the tool list, the preferences that apply everywhere, who else is working here, what happened here since your last visit, the work nobody finished, and a briefing of memories for this project. Later commands take the project from the repository they run in. A write that cannot resolve one is stored **unattributed** rather than guessed, and `begin` reports how many of those exist.

On a **first** visit there is no last visit to measure against, so the office does not answer with nothing: it hands over its most recent activity, each item labelled with the project it came from. That is what tells a new agent the office has been used at all, and it is the difference between knowing another hand has been here and going hunting the machine for changes you do not remember making. Every session is listed with how long ago it checked in, so one that stopped days ago is not mistaken for a colleague who is here now.

The project for any command is its own `--project` if given, else the repository it runs in, else what the session remembers — which only matters in the agent-office checkout itself (where nothing is inferred, so the office is not mistaken for your target; use `--project .` to work on it) and in folders outside any repository (a repository whose checkout is your home folder, such as a dotfiles repo, counts as none). If the folder decides a different project from the one a named session began on, the command says so on stderr. `--by` names you; a field you do not restate is *kept*, not cleared. A read with no project at all is scoped to the everywhere notes rather than the whole store, with two deliberate exceptions noted in [Retrieval](#retrieval).

### Two agents, one office

A session is keyed by author, so one agent cannot inherit or overwrite another's. Name yourself and the office keeps the two apart:

- `begin --by <name>` records *that agent's* row. Its later commands resolve through it.
- Declining to name yourself puts you in the **unnamed slot**: a project you declare is remembered there, nothing is ever attributed to you, and `begin` says so on stderr. That slot is not a person, so it never makes the office ambiguous.
- **An author is never inherited.** An undeclared caller is handed no name at all, not even the machine's only remembered one — borrowing that is how one agent's work came to be signed with another's. The *project* may still be remembered; the name may not. Ambiguity (two or more *named* sessions and no name) reaches the same null author with a louder warning.
- `begin` lists every session it remembers and what the others did since you were last here. That is measured against your own previous check-in, so a first visit is handed the recent activity instead — labelled by project — because there is no last visit of its own to measure from.

`--by` is expected and will be required in a future release. Export `OFFICE_AUTHOR` instead of repeating the flag. The reasoning is in [docs/sessions-and-notices.md](docs/sessions-and-notices.md).

### Reading without checking in

`begin` is the front door and it writes, which locks out the agents it ought to suit most: one told not to modify state reads `AGENTS.md`, sees that `begin` records a session, and correctly refuses to run it — so it never enters at all. `office peek` is the read-only way in. Same briefing, nothing written; it is exactly `begin --readonly`. Because a peek does not move your check-in mark, its "since you were last here" notices repeat until a real `begin` moves it, and it says so rather than pretending to be a check-in. On a first visit there is no watermark to move, so the recent activity reads the same every time until you begin.

The other reads never write either — `context`, `search`, `work`, `issues`, `tools`, `list`, `status`. Only `begin`, `remember`, `forget`, and the work/issue/tools writers change the record.

## Two records, one file

They share the database because "your whole memory is one thing you can copy" is the point. They stay separate lists because almost nothing else about them matches.

| | memories | work log |
|---|---|---|
| written | deliberately | while working |
| edited | corrected, deletable | never |
| read by | meaning | time |
| failure mode | wrong or stale | too much of it |
| retention | never pruned | oldest closed work dropped past a size cap |

"Done" is not stored anywhere. A piece of work is open while nobody has written a closing line, so an agent that dies mid-task leaves exactly the truth — opened, some notes, no close. The trail is capped at `OFFICE_LOG_CAP` characters (default 1,000,000) and prunes the oldest *closed* work; open work is the handoff and is never dropped.

The read is scoped the same way memories are, and the scope is a required choice in the code rather than an optional filter. `office work` with a project is that project's unfinished business; with no project it is the **unclaimed** items, which belong to nobody and therefore cannot be handed to the wrong project. `office work log` is the whole trail, every project, and is meant to be asked for by name.

```bash
office work                       # unfinished work for this project
                                  # (with no project: the unclaimed items)
office work open "photo sort"     # returns an id
office work note 4 "2023 done, 2024 untouched"
office work close 4
office work log --all --limit 20  # the whole trail, every project
```

`office work note` is the handoff. The reason it is written *while* working is that an agent running out of context cannot write its own death notice.

## Issues and the office manager

Beside the two records there is a short list of **issues**: friction in the office itself — something it blocks, lacks, or gets wrong. It has the work log's shape (append-only; open until someone writes a closing line) in tables of its own, so an issue never appears in a project's unfinished work. It is deliberately not scoped to a project: every session sees the same open issues whatever it is working on, so a problem is added to rather than filed twice. An issue records the project it came up in as context, not as a filter. Bugs in the repo an agent is working on are not issues; a repo problem that exposes an office problem is.

```bash
office issues [--all]                    # open issues (--all adds closed)
office issue open "begin lists dead sessions as present"
office issue note 3 "same here, after compaction"
office issue close 3 "fixed in 1f3b6e0"  # the resolution line is required
```

`begin` lists up to five open issues, counts the rest, and tells a session when someone else closed one it filed — which matters for sessions that run for days.

One session at a time may hold the **manager** role, and the human designates it: `office begin --role manager --by <name>`, or `OFFICE_ROLE=manager` in the launcher. Taking the role moves it from whoever had it; `--role none` gives it up; a role needs a name, and a peek (which writes nothing) cannot take one. `begin` shows who is manager and when they were last seen, and says so when there is none or the one named has been away more than three days — in which case issues go to the human. The role is a convention the briefing carries, not an access control; nothing in the office checks it. The manager triages issues and proposes changes, and is never a gate on anyone else's work.

## Tools

The tool list lives in the database and comes back from `office begin`, so describing something once is enough for every later session — no stale copy in the instruction file.

```bash
office tools add ffmpeg --use "ffmpeg -i in.mp4 out.mp4" "local video conversion"
office tools add ffmpeg "local video conversion, h264 defaults"   # updates in place
office tools
office tools remove ffmpeg
```

## Retrieval

`context` and `search` return memories for the session's project plus those marked `--global`, and they apply a relevance floor. Word matches are always kept; meaning-only hits must clear `OFFICE_MIN_SIM` (default `0.30`). So a question with no answer returns nothing instead of eight near misses, and the agent can trust an empty result.

Reads are scoped to the repository they run in; outside any repository, named reads use the project the session remembers (pass the numbered `--by` name or set `OFFICE_AUTHOR`). A command's `--project` overrides both for that read; `OFFICE_PROJECT` (or the older `OFFICE_SOURCE`) works too, from a launcher. Reads do not change the remembered project. `office list` and `office work log` keep their explicit whole-store behavior.

Queries also search the names and descriptions of skills available on this computer, whatever the project. JSON keeps memory results in `hits` and adds `skill_hits`, whose entries have `kind: "skill"`, `name`, `description`, and the absolute `SKILL.md` path, plus ranking evidence. `skills_searched` counts the available skills and `skills_problems` reports unreadable metadata. `--limit` caps each list independently; `--text` prints matching skills and their paths. Meaning-only skill matches use the same relevance floor; word matching works if the embedder is down. An empty `context` query still returns recent memories, without skill matches.

Skill files remain the source of truth. Discovery re-reads their metadata each time and caches only derived embeddings in the daemon's memory; edits, removals, and machine restrictions take effect on the next search. It does not add skill copies to the memory database.

**Scope is a rule, not a default.** A session that never named a project reads the notes that apply everywhere and nothing else: it does not fall back to the whole store. A missing or mistyped `--project` therefore shows up as an empty answer with a note naming the reason, rather than as another project's notes presented as if they were relevant. Every result carries which rule was applied — `"scope": "project"` or `"scope": "global"` — and the same rule governs the briefing's memory list and its unfinished work, with the recent-list path of an empty `context` query following it too.

Two things are deliberately left unscoped, and both exist so that a handoff is never lost:

- **Recent activity.** A session with no visit of its own is shown the office's most recent trail rather than nothing. Each item names the project it belongs to, so it reads as news about the office instead of a claim on your time.
- **Unclaimed records.** Work and memories filed with no project belong to nobody, so a session with no project is shown them rather than finding them hidden from every scoped read. The office names a record as unclaimed at the moment it is written, while the agent can still fix it for free.

The whole-store reads are the ones asked for by name: `office list` for memories, and `office work log` for the entire trail.

That is why an unrouted read is never ambiguous: an empty result is either "nothing relevant here", "nothing stored for this project yet", or "no project declared — only the everywhere notes were in scope", and the note says which.

```bash
office context "add rate limiting to checkout"
office search "checkout rate limit"
office remember --tag convention "60 req/min per IP, enforced in src/server/checkout.ts"
office remember --global "prefers tabs over spaces"
office forget 12
```

## The desk

Type `office` with no arguments to open the desk: one screen with daemon/embedder status, the active project (and every session, when more than one is recorded), database size, work log size, write volume, and warnings if the store is running away — including too much unfinished work. `s` start/stop, `r` restart, `f` fix, `q` leave.

Agents still use the CLI. Office instructions are **opt-in per project**, not global — `AGENTS.md` goes in each project that uses the office and never in the home folder itself. To give a project the office, run `office init` in it:

```bash
office init /path/to/that/project
```

It creates the repository if there is none, links `.claude/skills` and `.agents/skills` to this checkout's skills (where nothing is there yet), adds the startup section to `AGENTS.md` unless it already has one (creating the file if needed), and links `CLAUDE.md` to it if there is no `CLAUDE.md`; whatever it leaves alone, it says so. The project is always the repository's folder as git reports it — nothing is recorded in `.git/config` — so a copied repository is a project of its own. It looks before it writes: a folder inside another repository is refused with the command to run instead, so is a folder that holds other repositories a few folders down (such as `~/Projects`), a link it finds is never edited or replaced, and nothing is hidden from git. Commit `AGENTS.md` and `CLAUDE.md`; the skills links point at this machine's checkout, so add them to `.gitignore` if you do not want to see them. Projects set up the old way, with `AGENTS.md` linked to this checkout's, keep working — init leaves those links alone and says so. The office database remains local to each computer; `AGENTS.md` and `skills/` travel with this repository when cloned.

## Skills

Skills are checked in under `skills/<name>/SKILL.md`, in the format Claude Code and Codex load natively (YAML frontmatter with `name` and `description`, then the procedure; templates and scripts sit beside it). They are not in the database: git is what carries them to every computer, and the folder is the only copy.

They apply to every project. `office begin` lists each skill's name, description, and path; `office skills` lists them on their own. `.claude/skills` and `.agents/skills` are symlinks to the same folder, so Claude Code and Codex started in this checkout — or in a project `office init` set up, which gets the same two links — also load them themselves.

A skill tied to one computer sets `metadata.machine` to that computer's `hostname` (comma-separated for several; matched without case). Other computers count it rather than list it. `OFFICE_MACHINE` overrides the hostname, and `OFFICE_SKILLS` points the office at another folder.

The first skill is [`human-feedback`](skills/human-feedback/SKILL.md): agents build an offline, project-specific test guide from its Fieldnotes template, and the human returns feedback as a ZIP.

[`desktop-polish`](skills/desktop-polish/SKILL.md) makes desktop apps look and feel finished. Agents follow its rules whenever they touch a desktop app's interface, and run its review (with `measure.py`, which counts the sizes, colours and spacing a codebase really uses) when asked to polish one. The skill holds the method; each project keeps its own values and decisions.

## Copying the store

The whole memory — and the work log — is that SQLite file. Stop the daemon, copy `memory.db` (and `-wal` / `-shm` if present) into the same place on the other machine (`~/.local/share/agent-office/`), and start the daemon there. That is a fork, not a live sync. Do not commit the database.

**Update the code first.** The schema migration is forward-only: a machine still running older code reads a newer store without complaint, then writes memories with no project and leaves the work log and tool list alone. `git pull` on the destination *before* you copy the file. The new store migrates itself the first time the daemon opens it.

## Env

| Variable | Meaning |
|---|---|
| `OFFICE_HOME` | Data directory |
| `OFFICE_DB` | SQLite path |
| `OFFICE_PORT` | Listen port (default 7701) |
| `OFFICE_PYTHON` | Python with sentence-transformers |
| `OFFICE_MODEL` | Embedding model (default `all-MiniLM-L6-v2`) |
| `OFFICE_PROJECT` | Default project for a session |
| `OFFICE_AUTHOR` | Your name — the `--by` default, so writes attribute correctly without repeating the flag |
| `OFFICE_MIN_SIM` | Relevance floor for meaning-only hits (default `0.30`) |
| `OFFICE_LOG_CAP` | Characters of work trail to keep (default `1000000`) |
| `OFFICE_SKILLS` | Skills folder (default: `skills/` in this checkout) |
| `OFFICE_MACHINE` | This computer's name for `metadata.machine` (default: `hostname`) |
| `OFFICE_PYTHON_BUILD` | Interpreter `install.sh` uses to build `./.venv` (default `python3`) |

`--source` and `OFFICE_SOURCE` are the old names for `--project` and `OFFICE_PROJECT`; they still work.

**The floor is absolute, so it belongs to the model.** `OFFICE_MIN_SIM` is a raw cosine cut-off, and models place unrelated text at very different scores — so "a better model" and "this model" cannot share one floor. Measured on 16 real notes from this machine with 14 answerable and 8 unanswerable queries, CPU, via the same `encode()` the sidecar uses:

| model | right note scores | a question with no answer scores | usable floor |
|---|---|---|---|
| `all-MiniLM-L6-v2` (default) | 0.30 – 0.73 | ≤ 0.14 | **0.25 – 0.30** |
| `BAAI/bge-small-en-v1.5` | 0.57 – 0.86 | up to 0.59 | ~0.59 |

bge-small ranks no better here (12/14 first place against 13/14) and compresses *everything* upward, so at the default `0.30` it answered every nonsense query with eight confident vector hits — the "an empty result is real" contract inverted. A query-side instruction prefix does not restore the separation (it lowers the right note to 0.57 while nonsense stays at 0.59). If you do switch models, re-tune `OFFICE_MIN_SIM` in the same change and re-embed: embeddings carry no record of the model that made them, so a half-switched store compares two vector spaces and returns quietly wrong similarities rather than crashing.

## Tests

```bash
bun test
bun run typecheck
```
