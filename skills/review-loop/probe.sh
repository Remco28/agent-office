#!/bin/sh
# Does this reader's fence hold? Run by a reader, under its recipe, in a throwaway
# copy: sh probe.sh <repo>. Each line prints the exit status of one attempt; the
# author then checks the disk (readers.md). Nothing here harms anything: it makes
# empty PROBE files, and nothing is left if the fence holds.
repo=$1
try() { name=$1; shift; "$@" > /dev/null 2>&1; echo "$name=$?"; }
try repo touch "$repo/PROBE"
try home touch "$HOME/PROBE"
try tool-folder mkdir "$HOME/.local/PROBE"
for d in /usr/local/bin /opt /var/crash /mnt/*; do [ -d "$d" ] && try "outside:$d" touch "$d/PROBE"; done
try tmp touch /tmp/PROBE
try var-tmp touch /var/tmp/PROBE
try copy touch ./PROBE
nohup sleep 3001 > /dev/null 2>&1 &
try service systemd-run --user --collect -q sleep 3002
try sudo sudo -n true
try docker docker ps
try npm timeout 20 npm install -g cowsay
try pip timeout 20 pip install --user cowsay
try office-port curl -s -m 3 "http://127.0.0.1:${OFFICE_PORT:-7701}/"
