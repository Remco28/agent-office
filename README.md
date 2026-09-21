# agent-office

Local working memory for standalone coding agents.

One SQLite file, a localhost daemon, and a CLI. It holds two records:

- **memories** — decided facts, conventions, pitfalls. Curated, searched by meaning (FTS5 + MiniLM embeddings), correctable.
- **work log** — an append-only trail of what agents have done. Read by time, never edited.

No identity layer, no account, no cloud. Not source control: code is git, memory is this file.

## Requirements

- [Bun](https://bun.sh)
- Python 3 (the installer creates a local `.venv` and downloads MiniLM)

## Setup on a machine

Code is git. Memory is not. Clone on each computer, run the installer, leave the database where it is.

```bash
git clone git@github.com:Remco28/agent-office.git ~/Projects/agent-office
cd ~/Projects/agent-office
./install.sh
office serve --detach
```

`install.sh` runs `bun install`, creates `./.venv` with sentence-transformers if needed, and symlinks `office` to `~/.local/bin/office`. First install is chunky (PyTorch + the model). Later updates:

```bash
git pull
./install.sh
```

If this machine already has MiniLM elsewhere and you do not want a second venv:

```bash
SKIP_VENV=1 ./install.sh
```

The daemon binds `127.0.0.1:7701`. Data lives in `~/.local/share/agent-office/memory.db` — outside the git repo. Each machine has its own filing cabinet.

## Starting a session

```bash
office begin --project ~/Projects/the-thing --by freebuff
```

That records the target for the session and returns the tool list, the preferences that apply everywhere, the work nobody finished, and a briefing of memories for this project. Later commands inherit the project. A write that cannot resolve one is stored **unattributed** rather than guessed, and `begin` reports how many of those exist.

Nothing is inferred from the working directory: agents are started in the office itself and name their target out loud. `--project` and `--by` replace what the office remembers; pass neither to just read.

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

Type `office` with no arguments to open the desk: one screen with daemon/embedder status, the active project, database size, work log size, write volume, and warnings if the store is running away — including too much unfinished work. `s` start/stop, `r` restart, `f` fix, `q` leave.

Agents still use the CLI. Office instructions are **opt-in per working directory**, not global — no `~/.AGENTS.md`. To give Freebuff (or another agent) the office, put `AGENTS.md` only in the folder you start that agent in:

```bash
ln -s ~/Projects/agent-office/AGENTS.md /path/to/that/project/AGENTS.md
```

Leave it out of every other project.

## Copying the store

The whole memory — and the work log — is that SQLite file. Stop the daemon, copy `memory.db` (and `-wal` / `-shm` if present), start it elsewhere. That is a fork, not a live sync. Do not commit the database.

## Env

| Variable | Meaning |
|---|---|
| `OFFICE_HOME` | Data directory |
| `OFFICE_DB` | SQLite path |
| `OFFICE_PORT` | Listen port (default 7701) |
| `OFFICE_PYTHON` | Python with sentence-transformers |
| `OFFICE_MODEL` | Embedding model (default `all-MiniLM-L6-v2`) |
| `OFFICE_PROJECT` | Default project for a session |
| `OFFICE_AUTHOR` | Default `--by` |
| `OFFICE_MIN_SIM` | Relevance floor for meaning-only hits (default `0.30`) |
| `OFFICE_LOG_CAP` | Characters of work trail to keep (default `1000000`) |

`--source` and `OFFICE_SOURCE` are the old names for `--project` and `OFFICE_PROJECT`; they still work.

## Tests

```bash
bun test
bun run typecheck
```
