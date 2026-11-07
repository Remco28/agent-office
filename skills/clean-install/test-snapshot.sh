#!/bin/bash
# Tests for snapshot.py: every case a review found, with the result it must
# give. Run it after changing snapshot.py: bash test-snapshot.sh
# Prints only failures, then a count; exit 1 if any failed. Linux (GNU tools),
# not as root (the unreadable cases need permissions to bite). Works in a
# temporary folder it deletes afterwards.
P=$(cd "$(dirname "$0")" && pwd)/snapshot.py
S=$(mktemp -d)
cd "$S" || exit 1
mkdir sn
fails=0; n=0
sv(){ python3 -I "$P" save "$@" >/dev/null 2>&1; }
# expect NAME EXIT [GREP] -- compare args
expect(){ local name=$1 want=$2 pat=$3; shift 3; n=$((n+1))
  out=$(python3 -I "$P" "$@" 2>&1); got=$?
  if [ "$got" != "$want" ] || { [ -n "$pat" ] && ! grep -qE -- "$pat" <<<"$out"; }; then
    fails=$((fails+1)); echo "FAIL $name (exit $got, want $want${pat:+, /$pat/})"; sed 's/^/    /' <<<"$out" | head -12; fi; }
c=0; nx(){ c=$((c+1)); eval "$1=sn/$c"; }

# --- round 0 (my first fixes)
printf 'export X=1\n' > rc; nx A; sv $A --file rc --command cron="printf 'j\n'"
printf 'export X=1\nexport X=1\n' > rc; nx B; sv $B --file rc --command cron="printf 'j\nj\n'"
expect dup-line 1 'export X=1   \[1 before, 2 after\]' compare $A $B
expect dup-cron 1 '\+ j   \[1 before, 2 after\]' compare $A $B
for c2 in "dconf dump /" "files=echo" "Files=echo" "CONTENTS=x" "a/b=echo" "x="; do expect "bad-name $c2" 2 'error' save sn/bad --command "$c2"; done
expect dup-name-case 2 'error' save sn/bad --command a=1 --command A=2
expect nothing 2 'nothing to record' save sn/bad
sv sn/root --folder /:1; n=$((n+1)); [ "$(wc -l < sn/root/files.txt)" -lt 60 ] || { fails=$((fails+1)); echo "FAIL root-depth"; }

# --- round 1
printf 'x\nx (copy 2)\n' > f; nx A; sv $A --file f; printf 'x\nx\n' > f; nx B; sv $B --file f
expect copy-marker-collision 1 '' compare $A $B
nx A; sv $A --command "s=echo $S/$A/ghost"; nx B; sv $B --command "s=true"
expect command-not-filtered 1 'ghost' compare $A $B
expect reuse-refused 2 'already exists' save $A --file f
expect missing-parent 2 'does not exist' save nope/x --file f
nx A; sv $A --folder "$S/newdir"; mkdir newdir; nx B; sv $B --folder "$S/newdir"
expect root-appears 1 'newdir/' compare $A $B
printf 'a\nb\n' > g; nx A; sv $A --file g; printf 'b\na\n' > g; nx B; sv $B --file g
expect order-swap 1 'checksum' compare $A $B
mkdir rec; sv "rec/snap: one" --folder rec; sv "rec/snap -> two" --folder rec
expect snapshots-in-recorded 0 'no trace left' compare "rec/snap: one" "rec/snap -> two"
mkdir -p ln_real; ln -s ln_real ln_link; sv ln_real/S1 --folder ln_real; sv ln_link/S2 --folder ln_real
expect snapshot-via-link 0 'no trace left' compare ln_real/S1 ln_link/S2

# --- round 2 and 3: kept data
ST=$S/st; mkdir -p $ST/myapp/history; echo x > $ST/myapp/history/log
nx A; sv $A --folder $ST; rm -rf $ST/myapp; nx B; sv $B --folder $ST
expect kept-wiped 1 'kept data removed' compare $A $B --keep $ST/myapp/history
nx A; sv $A --folder $ST; mkdir $ST/myapp; nx B; sv $B --folder $ST
expect empty-parent-left 1 "myapp/$" compare $A $B --keep $ST/myapp/history
nx B; sv $B --folder $ST --folder $ST/myapp/history
nx A2; rmdir $ST/myapp; sv $A2 --folder $ST --folder $ST/myapp/history; mkdir $ST/myapp; nx B2; sv $B2 --folder $ST --folder $ST/myapp/history
expect empty-parent-left-kept-recorded-missing 1 "myapp/$" compare $A2 $B2 --keep $ST/myapp/history
nx A2; rmdir $ST/myapp; sv $A2 --folder $ST --file $ST/myapp/history/h.db; mkdir $ST/myapp; nx B2; sv $B2 --folder $ST --file $ST/myapp/history/h.db
expect empty-parent-left-kept-file-missing 1 "myapp/$" compare $A2 $B2 --keep $ST/myapp/history
rmdir $ST/myapp; nx A2; sv $A2 --folder $ST:2; mkdir -p $ST/myapp/history; nx B2; sv $B2 --folder $ST:2
expect empty-kept-folder-parent 1 "myapp/$" compare $A2 $B2 --keep $ST/myapp/history
rm -rf $ST/myapp; mkdir -p $S/h2/.local/state; nx A; sv $A --folder $S/h2:3; rmdir $S/h2/.local/state; nx B; sv $B --folder $S/h2:3
expect preexisting-parent-removed 1 'state/$' compare $A $B --keep $S/h2/.local/state/myapp/history
nx A; sv $A --folder $ST; mkdir -p $ST/myapp/history; touch $ST/myapp/history/h; nx B; sv $B --folder $ST
expect good-uninstall 0 'no trace left' compare $A $B --keep $ST/myapp/history
rm -rf $ST/myapp; nx A; sv $A --folder $ST/myapp; mkdir -p $ST/myapp/history; touch $ST/myapp/history/h; nx B; sv $B --folder $ST/myapp
expect root-missing-holds-kept 0 'no trace left' compare $A $B --keep $ST/myapp/history
mkdir $ST/myapp/install; touch $ST/myapp/install/l; nx B; sv $B --folder $ST/myapp
expect ledger-left 1 'install/l' compare $A $B --keep $ST/myapp/history
rm -rf $ST/myapp; mkdir -p $ST/myapp/history; echo d1 > $ST/myapp/history/log
nx A; sv $A --folder $ST --file $ST/myapp/history/log --file $ST/myapp/history/new
echo d2 >> $ST/myapp/history/log; touch $ST/myapp/history/new; nx B; sv $B --folder $ST --file $ST/myapp/history/log --file $ST/myapp/history/new
expect kept-file-grew 0 'no trace left' compare $A $B --keep $ST/myapp/history
rm $ST/myapp/history/log; nx C; sv $C --folder $ST --file $ST/myapp/history/log --file $ST/myapp/history/new
expect kept-file-deleted 1 'log: \(no such file\)   \(kept data removed\)' compare $B $C --keep $ST/myapp/history
mkdir -p r; nx A; sv $A --folder r; mkdir -p "r/hist: old" r/hist; touch r/hist/x; nx B; sv $B --folder r
expect colon-sibling-not-kept 1 'hist: old/' compare $A $B --keep r/hist

# --- one-sided kinds, unreadable, permissions, links, names, INI
nx A; sv $A --folder $ST --command units=true; nx B; sv $B --folder $ST
expect kind-one-side 1 'counts as a difference' compare $A $B
echo a > sec; chmod 000 sec; nx A; sv $A --file sec; chmod 600 sec; echo b >> sec; chmod 000 sec; nx B; sv $B --file sec; chmod 600 sec
expect unreadable-file 1 'not proven' compare $A $B
mkdir -p ur/hid; chmod 000 ur/hid; nx A; sv $A --folder ur; nx B; sv $B --folder ur; chmod 700 ur/hid
expect unreadable-folder 1 'not proven' compare $A $B
nx A; sv $A --file sec; chmod 644 sec; nx B; sv $B --file sec
expect mode-change 1 'mode -rw-r--r--' compare $A $B
mkdir t1 t2; ln -s t1 cur; nx A; sv $A --folder cur; ln -sfn t2 cur; nx B; sv $B --folder cur
expect root-link-retarget 1 'cur -> t2' compare $A $B
ln -s none1 bl; nx A; sv $A --folder bl; ln -sfn none2 bl; nx B; sv $B --folder bl
expect broken-root-link-retarget 1 'bl -> none2' compare $A $B
mkdir dot; echo a > dot/bashrc; ln -s dot/bashrc lrc; nx A; sv $A --file lrc; cp --remove-destination dot/bashrc lrc; nx B; sv $B --file lrc
expect file-link-replaced 1 'link -> dot/bashrc' compare $A $B
echo a > dot/other; ln -sfn dot/other lrc2; nx A; sv $A --file lrc2; ln -sfn dot/bashrc lrc2; nx B; sv $B --file lrc2
expect file-link-retarget 1 'link -> dot/bashrc' compare $A $B
ln -s gone dang; nx A; sv $A --file dang; nx B; sv $B --file dang
expect dangling-file-link-stable 0 'no trace left' compare $A $B
mkdir nl; touch $'nl/aa\nbb'; nx A; sv $A --folder nl; mv $'nl/aa\nbb' 'nl/aa\nbb'; nx B; sv $B --folder nl
expect newline-vs-backslash-n 1 '' compare $A $B
touch $'nl/g\n'; nx A; sv $A --folder nl; mv $'nl/g\n' nl/g; nx B; sv $B --folder nl
expect newline-rename 1 '' compare $A $B
nx A; sv $A --command "s=printf 'alpha\n[note]\nbeta\n'"; n=$((n+1)); grep -qx 'beta' $A/s.txt || { fails=$((fails+1)); echo "FAIL ini-only-at-start"; }
echo hi > f2; nx A; sv $A --folder $ST --file f2 --command "s=printf '[a]\nk=1\n[b]\nk=1\n'"; nx B; sv $B --folder $ST --file f2 --command "s=printf '[b]\nk=1\n[a]\nk=1\n'"
expect all-clean 0 'no trace left' compare $A $B

chmod -R u+rwx "$S"; rm -rf "$S"
echo "$((n-fails))/$n passed"
[ "$fails" = 0 ]
