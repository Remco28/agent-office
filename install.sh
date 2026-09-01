#!/usr/bin/env bash
# Install agent-office on this machine: deps, optional embed venv, PATH symlink.
# Does not touch the memory database.
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
cd "$root"

if ! command -v bun >/dev/null 2>&1; then
  echo "bun is required. Install from https://bun.sh then re-run." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required." >&2
  exit 1
fi

bun install

if [[ "${SKIP_VENV:-}" == "1" ]]; then
  echo "SKIP_VENV=1 — not creating .venv (set OFFICE_PYTHON if needed)"
elif [[ ! -x "$root/.venv/bin/python3" ]]; then
  python3 -m venv "$root/.venv"
  "$root/.venv/bin/pip" install --upgrade pip
  "$root/.venv/bin/pip" install sentence-transformers
else
  echo "using existing $root/.venv"
fi

mkdir -p "$HOME/.local/bin"
ln -sfn "$root/bin/office" "$HOME/.local/bin/office"
chmod +x "$root/bin/office"

echo
echo "ok.  office -> $HOME/.local/bin/office"
echo "data stays on this machine: ~/.local/share/agent-office/"
echo "start:  office serve --detach"
echo "if ~/.local/bin is not on PATH, add it."
