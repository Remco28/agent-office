# agent-office

Local working memory for standalone coding agents.

One SQLite file, a localhost daemon, and a CLI. It holds two records.

- **Memories.** Decided facts, conventions and pitfalls. Agents write them on purpose, can correct or delete them, and find them by meaning with FTS5 and MiniLM embeddings.
- **Work log.** An append-only trail of what agents have done. Agents read it by time and never edit it.

There is no identity layer, no account and no cloud. It is not source control. Code goes in git, and memory goes in this file.

## Why

Coding agents start with no memory. Providers rarely let a session survive, and often a fresh session is better anyway. So every agent arrives without knowing what the last one was in the middle of, what was decided and why, which tools this machine has, or which conventions we keep repeating. Git holds the code and none of that.

**You start every agent inside the project it works on.** Set the project up once with `office init`. From then on, an agent started in that repository or in any git worktree of it checks in, and the office uses the folder to tell it which project it is in. The agent reads what the last agent learned and gets to work. One agent works in one repository. To work on another, start another agent there.

That is also how a human stops repeating themselves. Describe a tool or a convention once, here, and no later agent has to be told again. Agents write the record for the next agent, not for you. It keeps what you told one session after that session ends.

Memory is per machine. A different install has different tools, and the store does not sync. To fork it on purpose, see [Copying the store](#copying-the-store).

## Requirements

- [Bun](https://bun.sh)
- Python 3. The installer builds a virtualenv with sentence-transformers and downloads MiniLM into it on first use.

Budget about 1.4 GB for that virtualenv on a machine with no NVIDIA GPU, which gets the CPU build of PyTorch. Budget about 5 GB where the CUDA build is installed. Word-matching search works without any of it, but meaning-matching does not.

## Setup on a machine

Code is git. Memory is not. Clone on each computer, run the installer, and leave the database where it is. Each machine keeps its own store. Nothing syncs, and the installer never touches the store.

The daemon binds `127.0.0.1:7701`. Data lives in `~/.local/share/agent-office/memory.db`, outside the git repo.

### A machine with nothing on it

```bash
git clone git@github.com:Remco28/agent-office.git ~/Projects/agent-office   # wherever you keep checkouts
cd ~/Projects/agent-office
./install.sh --verify
```

`install.sh` runs `bun install`, builds `./.venv` and symlinks `office` into `~/.local/bin`. With `--verify` it also starts the daemon and checks that meaning-search works. The first query downloads MiniLM, so that step needs the network once.

On a machine with no NVIDIA GPU, `install.sh` installs the CPU build of PyTorch instead of the default Linux wheel, which is the CUDA one. That makes the venv about 1.4 GB instead of 5 GB, for a GPU this laptop does not have. `install.sh` makes that choice itself.

### What breaks on a new machine

Four things went wrong the second time someone set this up. `install.sh` now handles all four, but they are worth knowing by name.

| Symptom | Cause | Fix |
|---|---|---|
| `office` works in your terminal but dies under an agent | bun's installer writes its PATH export to the end of `~/.bashrc`, after the "if not running interactively" guard, so agent shells never see `~/.bun/bin` | `install.sh` links bun into `~/.local/bin`, and `bin/office` also falls back to the install locations instead of trusting PATH |
| `embedder: false` with no reason anywhere | a detached daemon used to discard its own stderr, and the sidecar writes its failure there | the daemon's output now goes to `~/.local/share/agent-office/office.log`. `office status` carries `embedder_error`, the desk quotes it, and `office logs` shows the rest |
| the venv build fails or installs nothing usable | the system `python3` was newer than the PyTorch wheels support | build with an older interpreter, for example `OFFICE_PYTHON_BUILD=~/.local/share/uv/python/cpython-3.12*/bin/python3 ./install.sh` |
| about 5 GB of venv on a laptop with no NVIDIA GPU | pip takes the CUDA build of torch by default on Linux | `install.sh` uses the CPU index when `nvidia-smi` finds nothing |

If `office status` reports `"embedder": false`, search still works but only matches words. You will see it in these places.

| where | what you see |
|---|---|
| `office status` | `"embedder": false`, plus `embedder_error` and the `python` it tried |
| the desk, a bare `office` | `Embedder  down`, and a warning line that quotes the sidecar |
| `office logs` | the daemon's own output, such as `office embedder: No module named torch` |
| `~/.local/share/agent-office/office.log` | the same file `office logs` reads |

### A machine that already has sentence-transformers

If some Python on that machine can already import it, do not build a second 5 GB venv. First confirm the interpreter, because the model has to be in that exact one.

```bash
/path/to/python3 -c "import sentence_transformers; print('ok')"
```

Then skip the venv and point the office at it.

```bash
SKIP_VENV=1 ./install.sh
export OFFICE_PYTHON=/path/to/python3
office stop && office serve --detach
office status
```

The daemon inherits its environment from whatever starts it, so `OFFICE_PYTHON` has to be set there. Passing it to `install.sh` alone does nothing. Put the `export` in your shell profile to make it permanent. Restart the daemon after you change it, because a running daemon keeps the interpreter it started with. `OFFICE_MODEL` works the same way, if that machine has a different embedding model cached.

### How it picks a Python

The office checks these in order and uses the first one that exists.

1. `OFFICE_PYTHON`. You set it explicitly, and it works only in a process started with it in its environment.
2. The interpreter that `install.sh` recorded in `~/.local/share/agent-office/python`. It is the one `install.sh` verified on this machine.
3. `./.venv/bin/python3`, which `install.sh` builds.
4. `python3` on `PATH`. It works only if that interpreter already has sentence-transformers.

So on a new machine you do one of two things. Let `install.sh` build `./.venv`, or set `OFFICE_PYTHON` to a Python that has the library. Case 4 is the trap. A bare `python3` without sentence-transformers looks exactly like a broken install.

`install.sh` keeps its record in the data directory, not in the checkout. That lets the venv live outside the repo, where `git clean -xfd` cannot delete it, without an environment variable in every shell. `office status` reports the interpreter in use as `python`, so you never have to guess which one it picked.

### Updating an existing machine

```bash
git pull
./install.sh
office stop        # the running daemon keeps the old code until it stops
```

You never need to start the daemon by hand. Any `office` command starts it if it is not running, and `office serve --detach` starts it explicitly.

## Using it

Run this once per project, from inside its repository.

```bash
office init                 # or: office init /path/to/the/project
```

`office init` creates a git repository if there is none. It links `.claude/skills` and `.agents/skills` to this checkout's skills, and adds the office's section to the project's `AGENTS.md`, creating the file if needed. If the project has no `CLAUDE.md`, it links `CLAUDE.md` to `AGENTS.md`. It looks before it writes. It refuses a folder inside another repository, and a folder that holds other repositories, such as `~/Projects`. It never edits a link, never edits a file it finds beyond adding its section, and never touches git's config. It reports on stderr whatever it left alone. Commit `AGENTS.md` and `CLAUDE.md`. The skills links point at this machine's checkout, so add them to `.gitignore` if you do not want to see them.

**That section is the agents' manual.** Every project carries the same one. It tells agents to check in with `office begin --by <tool>` and to sign everything with the numbered name it hands back. They write work notes as they go, and store decisions as memories but never secrets. They keep temporary files out of the repository, and copy a file outside the repository before changing it. They never delete what they did not make without asking. `AGENTS.md` in this repository is different. It is the guide for agents working on the office itself, with the design rules a change must not break.

What a human should know:

- **The folder is the project.** A command's project is its `--project` or `OFFICE_PROJECT`, else the git repository it runs in, else none. Any worktree of the repository counts. A bare name such as `crokinole` means the folder of that name beside this checkout. One agent works in one repository. To work on another, start another agent there.
- **Two records, one file.** They share the database so that the whole memory is one file you can copy. They stay separate lists because almost nothing else about them matches.

  | | memories | work log |
  |---|---|---|
  | written | deliberately | while working |
  | edited | corrected or deleted | never |
  | read by | meaning | time |
  | retention | never pruned | the oldest closed work is dropped past `OFFICE_LOG_CAP` |

  Done is not a status. Work stays open until someone writes a closing line, so an agent that dies mid-task leaves an accurate record.
- **Names are signatures.** `--by codex` hands back a name like `codex-4821` for that run, and every later write signs with it. So you can tell which provider and which run did what. A call with no name is unsigned, and the office says so.
- **Nothing is lost quietly.** The office refuses a memory with no project, because no read would find it. It shows work with no project as unclaimed. Reads never write. `office peek` is a check-in that writes nothing, for an agent told not to change anything.
- **Moved and removed projects.** A check-in records the repository's first commit. If a folder moves, the first check-in in the new folder says so and asks the agent to check with you. `office move <old path>` then brings the notes over. It refuses on a copy, a merge or a different history. `office status` lists projects whose folder is not found and that still hold memories or unfinished work. The office never deletes anything for being gone.
- **Issues** are problems with the office itself, not bugs in a project. The commands are `office issues` and `office issue open|note|close`. An agent working in this repository reads them at the start and brings decisions to you.
- **Tools** are this machine's list. The office keeps it in the database and hands it to every agent at check-in. Add one with `office tools add <name> --use "<command>" "<what it is>"`.
- **Search** with `office context` or `office search` applies a relevance floor, so an empty answer means nothing relevant is recorded. The floor depends on the embedding model. Read [docs/retrieval-floor.md](docs/retrieval-floor.md) before changing either.

`office help` lists every command. [docs/sessions-and-notices.md](docs/sessions-and-notices.md) records the design history.

## The desk

Type `office` with no arguments to open the desk. It is one screen that shows daemon and embedder status, the latest sessions, database and work-log size, write volume and how many projects' folders are not found. It also warns if the store is growing too fast. The keys are `s` to start or stop, `r` to restart, `f` to fix and `q` to leave. Agents use the CLI, never the desk.

## Skills

The repository holds skills under `skills/<name>/SKILL.md`, in the format Claude Code and Codex load natively, so git carries them to every computer. `office begin` lists them, `office skills` lists them again, and `context` and `search` find them by meaning. A skill tied to one computer sets `metadata.machine` to its `hostname`. `AGENTS.md` explains how to write one.

## Copying the store

The whole memory, including the work log, is that SQLite file. Stop the daemon and copy `memory.db` to the same place on the other machine, `~/.local/share/agent-office/`. Copy the `-wal` and `-shm` files too if they exist. Then start the daemon there. That makes a fork, not a live sync. Do not commit the database.

**Update the code first.** The schema migration only goes forward. A machine still running older code reads a newer store without complaint, then writes memories with no project and writes nothing to the work log or tool list. Run `git pull` on the destination before you copy the file. The new store migrates itself the first time the daemon opens it.

## Env

| Variable | Meaning |
|---|---|
| `OFFICE_HOME` | Data directory |
| `OFFICE_DB` | SQLite path |
| `OFFICE_PORT` | Listen port, default 7701 |
| `OFFICE_PYTHON` | Python with sentence-transformers |
| `OFFICE_MODEL` | Embedding model, default `all-MiniLM-L6-v2` |
| `OFFICE_PROJECT` | Default project for a session |
| `OFFICE_PROJECTS_DIR` | Where the office looks up a bare project name. The default is the folder that holds this checkout |
| `OFFICE_AUTHOR` | Your name. It is the default for `--by`, so your writes are signed without repeating the flag |
| `OFFICE_MIN_SIM` | Relevance floor for meaning-only hits, default `0.30` |
| `OFFICE_LOG_CAP` | Characters of work trail to keep, default `1000000` |
| `OFFICE_SKILLS` | Skills folder. The default is `skills/` in this checkout |
| `OFFICE_MACHINE` | This computer's name for `metadata.machine`. The default is `hostname` |
| `OFFICE_PYTHON_BUILD` | Interpreter that `install.sh` uses to build `./.venv`, default `python3` |

`--source` and `OFFICE_SOURCE` are the old names for `--project` and `OFFICE_PROJECT`, and they still work.

[docs/retrieval-floor.md](docs/retrieval-floor.md) explains how to choose `OFFICE_MIN_SIM` for a model.

## Tests

```bash
bun test
bun run typecheck
```
