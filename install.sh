#!/usr/bin/env bash
#
# install.sh — put agent-office on this machine: dependencies, embedder venv,
# PATH entries. Idempotent, and it never touches the memory database.
#
#   ./install.sh              install
#   ./install.sh --verify     install, then start the daemon and prove that
#                             meaning-search actually works
#   SKIP_VENV=1 ./install.sh  deps + symlink only; point OFFICE_PYTHON at an
#                             interpreter that already has sentence-transformers
#
# Env:
#   OFFICE_PYTHON_BUILD  interpreter used to build ./.venv (default: python3).
#                        The PyTorch wheel chain lags new Pythons, so if the
#                        build fails, name an older one — e.g. a uv-managed 3.12:
#                        OFFICE_PYTHON_BUILD=~/.local/share/uv/python/cpython-3.12*/bin/python3 ./install.sh
#
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
cd "$root"

verify=0
case "${1:-}" in
  --verify) verify=1 ;;
  -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
  "") ;;
  *) echo "unknown argument: $1 (try --help)" >&2; exit 2 ;;
esac

data_dir="${OFFICE_HOME:-$HOME/.local/share/agent-office}"
log() { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- prerequisites
command -v bun >/dev/null 2>&1 ||
  die "bun is required:  curl -fsSL https://bun.sh/install | bash"
command -v python3 >/dev/null 2>&1 || die "python3 is required."

# The daemon is started by agents and user services, which get a NON-interactive
# environment where the bun installer's ~/.bashrc export never runs. If bun is
# unreachable that way, every `office` call dies at `exec bun` while the terminal
# that installed it looks perfectly fine. So link it where the session PATH is.
if ! env -i HOME="$HOME" PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin" \
  bash -c 'command -v bun' >/dev/null 2>&1; then
  mkdir -p "$HOME/.local/bin"
  ln -sfn "${BUN_INSTALL:-$HOME/.bun}/bin/bun" "$HOME/.local/bin/bun"
  log "linked bun into ~/.local/bin (non-interactive shells could not see it)"
fi

log "bun install"
bun install

# ------------------------------------------------------------------- embedder
# Word search (FTS5) needs nothing. Meaning search needs sentence-transformers,
# which pulls PyTorch — and on Linux the default wheel is the CUDA build: about
# 5 GB that a machine with no NVIDIA GPU cannot use. There is no reason to pay
# that, so build against the CPU index when there is no GPU.
cpu_torch=1
if command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi -L >/dev/null 2>&1; then
  cpu_torch=0
fi

record_python() {
  mkdir -p "$data_dir"
  printf '%s\n' "$1" >"$data_dir/python"
}

if [[ "${SKIP_VENV:-}" == "1" ]]; then
  log "SKIP_VENV=1 — not building .venv"
  if [[ -n "${OFFICE_PYTHON:-}" && -x "${OFFICE_PYTHON:-}" ]]; then
    record_python "$OFFICE_PYTHON"
  else
    warn "SKIP_VENV=1 but OFFICE_PYTHON is unset or not executable — nothing recorded,"
    warn "so the daemon will fall back to a bare python3 that probably lacks the library"
  fi
elif [[ -x "$root/.venv/bin/python3" ]]; then
  log "using existing $root/.venv"
  record_python "$root/.venv/bin/python3"
else
  build_python="${OFFICE_PYTHON_BUILD:-python3}"
  log "building ./.venv with $build_python"
  if ! "$build_python" -m venv "$root/.venv"; then
    die "could not create a venv with $build_python (python3-venv missing? wrong path?) — see OFFICE_PYTHON_BUILD above"
  fi
  "$root/.venv/bin/pip" install --quiet --upgrade pip
  if [[ "$cpu_torch" == "1" ]]; then
    log "no NVIDIA GPU — taking the CPU build of torch"
    "$root/.venv/bin/pip" install --quiet torch --index-url https://download.pytorch.org/whl/cpu
  fi
  "$root/.venv/bin/pip" install --quiet sentence-transformers
  record_python "$root/.venv/bin/python3"
fi

# The interpreter the daemon will actually pick, in the same order as
# src/paths.ts: an explicit OFFICE_PYTHON, then what an install recorded here,
# then the checkout's own venv, then plain python3.
resolve_python() {
  if [[ -n "${OFFICE_PYTHON:-}" && -x "${OFFICE_PYTHON:-}" ]]; then
    printf '%s' "$OFFICE_PYTHON"
    return 0
  fi
  if [[ -r "$data_dir/python" ]]; then
    local recorded
    recorded="$(head -n1 "$data_dir/python" 2>/dev/null || true)"
    if [[ -n "$recorded" && -x "$recorded" ]]; then
      printf '%s' "$recorded"
      return 0
    fi
  fi
  if [[ -x "$root/.venv/bin/python3" ]]; then
    printf '%s' "$root/.venv/bin/python3"
    return 0
  fi
  printf '%s' "python3"
}

interpreter="$(resolve_python)"
log "embedder interpreter: $interpreter"
embedder_ok=0
if "$interpreter" -c 'import sentence_transformers' >/dev/null 2>&1; then
  embedder_ok=1
  log "verified: sentence-transformers imports"
else
  warn "$interpreter cannot import sentence-transformers"
  cat >&2 <<'MSG'
    Search still works, but only on exact words — no meaning-matching.
    In the order worth trying:
      1. the venv build above failed (see the pip output)
      2. python3 was too new for the PyTorch wheel chain; build with an older one:
           OFFICE_PYTHON_BUILD=~/.local/share/uv/python/cpython-3.12*/bin/python3 ./install.sh
      3. the wrong interpreter is being used; name the right one in the DAEMON's
         environment:  export OFFICE_PYTHON=/path/to/python3
    Then ask the daemon:  office status   (fields: embedder, python, embedder_error)
    and read its own side: office logs
MSG
fi

# ---------------------------------------------------------------------- wiring
mkdir -p "$HOME/.local/bin"
ln -sfn "$root/bin/office" "$HOME/.local/bin/office"
chmod +x "$root/bin/office" "$root/install.sh"

# Office instructions are opt-in per working directory, never global.
# Remove home-directory links this installer used to create.
for home_file in "$HOME/.knowledge.md" "$HOME/.AGENTS.md"; do
  if [[ -L "$home_file" ]]; then
    target="$(readlink "$home_file" || true)"
    if [[ "$target" == *agent-office/* ]]; then
      rm -f "$home_file"
      echo "removed stale $home_file"
    fi
  fi
done

# ------------------------------------------------------------------ verification
if [[ "$verify" == "1" ]]; then
  log "starting the daemon and checking the embedder (first start downloads the model, ~90 MB)"
  "$HOME/.local/bin/office" serve --detach >/dev/null 2>&1 || true
  verified=0
  for _ in $(seq 1 30); do
    state="$("$HOME/.local/bin/office" status 2>/dev/null || true)"
    case "$state" in
      *'"embedder": true'*) verified=1; break ;;
    esac
    sleep 3
  done
  if [[ "$verified" == "1" ]]; then
    log "PASS — meaning-search is live"
  else
    warn "embedder did not come up in 90s; that is what it looks like on a machine"
    warn "where the venv is missing or the wrong interpreter was picked:"
    "$HOME/.local/bin/office" logs -n 12 >&2 || true
  fi
fi

echo
echo "ok.  office -> $HOME/.local/bin/office"
echo "     data stays on this machine: $data_dir/"
if [[ "$embedder_ok" == "1" ]]; then
  echo "     embedder: $interpreter"
else
  echo "     embedder: NOT working — word search only (see above)"
fi
echo "start:  office serve --detach"
echo "verify: office status       ('embedder': true means meaning-search is live)"
echo "unwell: office logs         (the daemon's own output)"
echo "if ~/.local/bin is not on PATH, add it."
