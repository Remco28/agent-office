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
office stop        # the running daemon keeps the old code until it stops
```

You never need to start the daemon by hand: any `office` command starts it if it is not running (`office serve --detach` does it explicitly).

## Using it

Once per project, from inside its repository:

```bash
office init                 # or: office init /path/to/the/project
```

It creates a git repository if there is none, links `.claude/skills` and `.agents/skills` to this checkout's skills, adds the office's section to the project's `AGENTS.md` (creating the file if needed), and links `CLAUDE.md` to it if there is no `CLAUDE.md`. It looks before it writes: it refuses a folder inside another repository or one that holds other repositories (such as `~/Projects`), never edits a link or a file it finds beyond adding its section, never touches git's config, and says on stderr whatever it left alone. Commit `AGENTS.md` and `CLAUDE.md`; the skills links point at this machine's checkout, so add them to `.gitignore` if you do not want to see them.

**That section is the agents' manual.** Every project carries the same one: check in with `office begin --by <tool>`, sign everything with the numbered name it hands back, write work notes as you go, store decisions as memories and never secrets, keep temporary files out of the repository, copy a file outside the repository before changing it, and never delete what you did not make without asking. `AGENTS.md` in *this* repository is different: it is the guide for agents working on the office itself, with the design rules a change must not break.

What a human should know:

- **The folder is the project.** A command's project is its `--project` (or `OFFICE_PROJECT`), else the git repository it runs in (any worktree of it counts), else none. A bare name such as `crokinole` means the folder of that name beside this checkout. One agent works in one repository; to work on another, start another agent there.
- **Two records, one file.** They share the database so that the whole memory is one file you can copy; they stay separate lists because almost nothing else about them matches.

  | | memories | work log |
  |---|---|---|
  | written | deliberately | while working |
  | edited | corrected, deletable | never |
  | read by | meaning | time |
  | retention | never pruned | oldest closed work dropped past `OFFICE_LOG_CAP` |

  "Done" is not a status: work is open until someone writes a closing line, so an agent that dies mid-task leaves exactly the truth.
- **Names are signatures.** `--by codex` hands back `codex-4821` for that run, and every later write signs with it, so you can tell which provider and which run did what. A call with no name is unsigned and says so.
- **Nothing is lost quietly.** A memory with no project is refused rather than stored where no read finds it; work with no project is shown as unclaimed; reads never write; `office peek` is a check-in that writes nothing, for an agent told not to change anything.
- **Moved and removed projects.** A check-in records the repository's first commit. If a folder moves, the first check-in in the new folder says so and asks the agent to check with you; `office move <old path>` then brings the notes over, and refuses on a copy, a merge or a different history. `office status` lists projects whose folder is not found. Nothing is ever deleted for being gone.
- **Issues** are friction in the office itself, not bugs in a project: `office issues`, `office issue open|note|close`. An agent working in this repository reads them at the start and brings decisions to you.
- **Tools** are this machine's list, kept in the database and handed to every agent at check-in: `office tools add <name> --use "<command>" "<what it is>"`.
- **Search** (`office context`, `office search`) applies a relevance floor, so an empty answer means nothing relevant is recorded. The floor belongs to the embedding model; see [docs/retrieval-floor.md](docs/retrieval-floor.md) before changing either.

`office help` lists every command. The design history is in [docs/sessions-and-notices.md](docs/sessions-and-notices.md).

## The desk

Type `office` with no arguments to open the desk: one screen with daemon and embedder status, the latest sessions, database and work-log size, write volume, how many projects' folders are not found, and warnings if the store is running away. `s` start/stop, `r` restart, `f` fix, `q` leave. Agents use the CLI, never the desk.

## Skills

Skills are checked in under `skills/<name>/SKILL.md`, in the format Claude Code and Codex load natively, so git carries them to every computer. `office begin` lists them, `office skills` lists them again, and `context`/`search` find them by meaning. A skill tied to one computer sets `metadata.machine` to its `hostname`. How to write one is in `AGENTS.md`.

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
| `OFFICE_PROJECTS_DIR` | Where a bare project name is looked up (default: the folder holding this checkout) |
| `OFFICE_AUTHOR` | Your name — the `--by` default, so writes attribute correctly without repeating the flag |
| `OFFICE_MIN_SIM` | Relevance floor for meaning-only hits (default `0.30`) |
| `OFFICE_LOG_CAP` | Characters of work trail to keep (default `1000000`) |
| `OFFICE_SKILLS` | Skills folder (default: `skills/` in this checkout) |
| `OFFICE_MACHINE` | This computer's name for `metadata.machine` (default: `hostname`) |
| `OFFICE_PYTHON_BUILD` | Interpreter `install.sh` uses to build `./.venv` (default `python3`) |

`--source` and `OFFICE_SOURCE` are the old names for `--project` and `OFFICE_PROJECT`; they still work.

How to choose `OFFICE_MIN_SIM` for a model is in [docs/retrieval-floor.md](docs/retrieval-floor.md).

## Tests

```bash
bun test
bun run typecheck
```
