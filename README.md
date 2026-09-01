# agent-office

Local working memory for standalone coding agents.

v1 is a filing cabinet: one SQLite database, a localhost daemon, and a CLI with three verbs (`context`, `remember`, `search`). Full-text search plus MiniLM embeddings. No identity layer.

## Requirements

- [Bun](https://bun.sh)
- Python 3 with `sentence-transformers` and the `all-MiniLM-L6-v2` model (already present in `~/callum/.venv` on this machine)

## Run

```bash
chmod +x bin/office
export PATH="$PWD/bin:$PATH"

office serve --detach
office remember --tag convention "Use WAL mode for sqlite."
office search "sqlite wal"
office context "how do we store sqlite"
office status
```

The daemon binds `127.0.0.1:7701`. Data lives in `~/.local/share/agent-office/memory.db` (override with `OFFICE_HOME` or `OFFICE_DB`).

Agents should read `AGENTS.md`.

## Copying the store

The whole memory is that SQLite file. Stop the daemon, copy `memory.db` (and `-wal` / `-shm` if present), start it elsewhere. That is a fork, not a live sync.

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
