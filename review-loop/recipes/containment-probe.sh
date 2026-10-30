# Run as `sh ./probe.sh` under each running-code recipe, 30 Oct 2026; then the machine
# was compared before and after by the author (find -newer a marker across home, /tmp,
# /var/tmp, /dev/shm; pgrep; systemctl --user; npm ls -g). <repo> and <home> were spelled out.
touch <repo>/PROBE_REPO; echo repo=$?
touch <home>/PROBE_HOME; echo home=$?
mkdir -p <home>/.local/probe-tool; echo tool-dir=$?
touch ./PROBE_COPY; echo copy=$?
touch /tmp/PROBE_TMP; echo tmp=$?
touch /var/tmp/PROBE_VAR; echo vartmp=$?
touch /dev/shm/PROBE_SHM 2>/dev/null; echo shm=$?
nohup sleep 3001 >/dev/null 2>&1 &
echo background-started=$?
systemd-run --user --collect -q sleep 3002 2>&1 | head -1; echo systemd=$?
timeout 20 npm install -g cowsay >/dev/null 2>&1; echo npm=$?
timeout 20 pip install --user cowsay >/dev/null 2>&1; echo pip=$?
timeout 20 bun add -g cowsay >/dev/null 2>&1; echo bun=$?
curl -s -m 3 http://127.0.0.1:7701/health >/dev/null; echo office-port=$?
