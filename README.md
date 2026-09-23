# agent-office

Local working memory for standalone coding agents.

One SQLite file, a localhost daemon, and a CLI. It holds two records:

- **memories** — decided facts, conventions, pitfalls. Curated, searched by meaning (FTS5 + MiniLM embeddings), correctable.
- **work log** — an append-only trail of what agents have done. Read by time, never edited.

No identity layer, no account, no cloud. Not source control: code is git, memory is this file.

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
office begin --project ~/Projects/the-thing --by freebuff
```

That records the target for the session and returns the tool list, the preferences that apply everywhere, the work nobody finished, and a briefing of memories for this project. Later commands inherit the project. A write that cannot resolve one is stored **unattributed** rather than guessed, and `begin` reports how many of those exist.

Nothing is inferred from the working directory: agents are started in the office itself and name their target out loud. `--project` and `--by` replace what the office remembers; pass neither to just read — and note that reads without a project are scoped to the everywhere notes, not to the whole store (see [Retrieval](#retrieval)).

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

**Scope is a rule, not a default.** A session that never named a project reads the notes that apply everywhere and nothing else: it does not fall back to the whole store. A missing or mistyped `--project` therefore shows up as an empty answer with a note naming the reason, rather than as another project's notes presented as if they were relevant. Every result carries which rule was applied — `"scope": "project"` or `"scope": "global"` — and the same rule governs the briefing's memory list and its unfinished work, with the recent-list path of an empty `context` query following it too. `office list` is the human's view and the one read that shows the whole store.

That is why an unrouted read is never ambiguous: an empty result is either "nothing relevant here", "nothing stored for this project yet", or "no project declared — only the everywhere notes were in scope", and the note says which.

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
| `OFFICE_AUTHOR` | Default `--by` |
| `OFFICE_MIN_SIM` | Relevance floor for meaning-only hits (default `0.30`) |
| `OFFICE_LOG_CAP` | Characters of work trail to keep (default `1000000`) |
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
