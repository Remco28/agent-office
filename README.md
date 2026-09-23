# agent-office

Local working memory for standalone coding agents.

One SQLite file, a localhost daemon, and a CLI. It holds two records:

- **memories** — decided facts, conventions, pitfalls. Curated, searched by meaning (FTS5 + MiniLM embeddings), correctable.
- **work log** — an append-only trail of what agents have done. Read by time, never edited.

No identity layer, no account, no cloud. Not source control: code is git, memory is this file.

## Requirements

- [Bun](https://bun.sh)
- Python 3 — the installer builds a virtualenv with sentence-transformers, and downloads MiniLM into it on first use

Budget roughly 5 GB for that virtualenv (PyTorch is most of it). Word-matching search works without it; meaning-matching does not.

## Setup on a machine

Code is git. Memory is not. Clone on each computer, run the installer, leave the database where it is. Each machine has its own filing cabinet — nothing syncs, and the installer never touches the store.

The daemon binds `127.0.0.1:7701`. Data lives in `~/.local/share/agent-office/memory.db`, outside the git repo.

### A machine with nothing on it

```bash
git clone git@github.com:Remco28/agent-office.git ~/Projects/agent-office
cd ~/Projects/agent-office
./install.sh
office serve --detach
office status                      # "embedder": true means meaning-search is live
```

`install.sh` runs `bun install`, creates `./.venv` with sentence-transformers, and symlinks `office` into `~/.local/bin`. The virtualenv is large and the first query downloads MiniLM, so both steps need network once.

If `office status` reports `"embedder": false`, search still works but only matches words. Expect it in three places:

| where | what you see |
|---|---|
| `office status` | `"embedder": false` |
| desk (bare `office`) | `Embedder  down`, plus a warning line |
| daemon log | `office embedder: ...`, or nothing at all |

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

1. `OFFICE_PYTHON`
2. `./.venv/bin/python3` — what `install.sh` builds
3. `~/callum/.venv/bin/python3` — from the machine this was first set up on; harmless elsewhere, but do not rely on it
4. `python3` on `PATH` — only works if that interpreter already has sentence-transformers

So on a new machine it is always one of two things: let `install.sh` build `./.venv`, or set `OFFICE_PYTHON` to a Python that has the library. Case 4 is the trap — a bare `python3` without sentence-transformers looks exactly like a broken install.

### Updating an existing machine

```bash
git pull
./install.sh
```

## Starting a session

```bash
office begin --project ~/Projects/the-thing --by <your-agent-name>
```

That records the target for the session and returns the tool list, the preferences that apply everywhere, who else is working here, what they wrote since your last visit, the work nobody finished, and a briefing of memories for this project. Later commands inherit the project **for you**. A write that cannot resolve one is stored **unattributed** rather than guessed, and `begin` reports how many of those exist.

Nothing is inferred from the working directory: agents are started in the office itself and name their target out loud. `--project` and `--by` replace what the office remembers under that name — a field you do not restate is *kept*, not cleared; pass neither to just read.

### Two agents, one office

A session is keyed by author, so one agent cannot inherit or overwrite another's. Name yourself and the office keeps the two apart:

- `begin --by <name>` records *that agent's* row. Its later commands resolve through it.
- Declining to name yourself puts you in the **unnamed slot**: a project you declare is remembered there, nothing is ever attributed to you, and `begin` says so on stderr. That slot is not a person, so it never makes the office ambiguous. Ambiguity is losing track of which *named* session you are — two named sessions and no name — and then nothing is inherited.
- `begin` lists every session it remembers and what the others did since you were last here. That is measured against your own previous check-in, so a first visit is handed the briefing rather than the whole trail.

`--by` is expected and will be required in a future release. Export `OFFICE_AUTHOR` instead of repeating the flag. The reasoning is in [docs/sessions-and-notices.md](docs/sessions-and-notices.md).

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

```bash
office work                       # unfinished work for this project
office work open "photo sort"     # returns an id
office work note 4 "2023 done, 2024 untouched"
office work close 4
office work log --all --limit 20  # the trail, newest first
```

`office work note` is the handoff. The reason it is written *while* working is that an agent running out of context cannot write its own death notice.

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

```bash
office context "add rate limiting to checkout"
office search "checkout rate limit"
office remember --tag convention "60 req/min per IP, enforced in src/server/checkout.ts"
office remember --global "prefers tabs over spaces"
office forget 12
```

## The desk

Type `office` with no arguments to open the desk: one screen with daemon/embedder status, the active project (and every session, when more than one is recorded), database size, work log size, write volume, and warnings if the store is running away — including too much unfinished work. `s` start/stop, `r` restart, `f` fix, `q` leave.

Agents still use the CLI. Office instructions are **opt-in per working directory**, not global — no `~/.AGENTS.md`. To give Freebuff (or another agent) the office, put `AGENTS.md` only in the folder you start that agent in:

```bash
ln -s ~/Projects/agent-office/AGENTS.md /path/to/that/project/AGENTS.md
```

Leave it out of every other project.

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

`--source` and `OFFICE_SOURCE` are the old names for `--project` and `OFFICE_PROJECT`; they still work.

## Tests

```bash
bun test
bun run typecheck
```
