# agent-office

Local working memory for standalone coding agents.

v1 is a filing cabinet: one SQLite database, a localhost daemon, and a CLI with three verbs (`context`, `remember`, `search`). Full-text search plus MiniLM embeddings. No identity layer.

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

Agents should read `AGENTS.md`.

## Copying the store

The whole memory is that SQLite file. Stop the daemon, copy `memory.db` (and `-wal` / `-shm` if present), start it elsewhere. That is a fork, not a live sync. Do not commit the database.

## Env

| Variable | Meaning |
|---|---|
| `OFFICE_HOME` | Data directory |
| `OFFICE_DB` | SQLite path |
| `OFFICE_PORT` | Listen port (default 7701) |
| `OFFICE_PYTHON` | Python with sentence-transformers |
| `OFFICE_MODEL` | Embedding model (default `all-MiniLM-L6-v2`) |
| `OFFICE_SOURCE` | Default `--source` on remember |

## Tests

```bash
bun test
```
