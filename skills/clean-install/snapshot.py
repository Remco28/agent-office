#!/usr/bin/env python3
"""Record what is on a computer, and compare two records: the "leaves no trace" test.

    snapshot.py save DIR [--folder PATH[:DEPTH]]... [--file PATH]... [--command NAME=CMD]... [--skip PATH]...
    snapshot.py compare A B [--keep PATH]...

save    DIR must be new (or empty) and its parent must exist, so a save
        never mixes with an older one or creates folders of its own.
        --folder lists PATH itself (or that it is missing) and every file
        and folder under it, to DEPTH levels (1 = only what is directly in
        it), or all of it. Links are listed with their target. This shows
        what exists: not what is inside a file, nor its permissions.
        --file records a file's lines (a shell profile, a settings file),
        repeats included, so a line left behind shows up, even a second
        copy of one that was already there. A checksum of the whole file
        is recorded too: if only it differs, the lines are the same but
        their order, line endings or final newline changed.
        --command saves the output of CMD as NAME.txt; NAME is letters,
        digits, - or _, used once, and not "files" or "contents" in any
        case. Output in INI form (`[group]` then `key=value`, as `dconf
        dump /` prints) is saved one `group/key=value` per line. A command
        that fails is recorded as such.
        --skip leaves out a folder and everything in it. DIR is always
        left out.
compare prints what is in A and not in B (-) and in B and not in A (+),
        counting repeated lines. For listed paths and file lines: anything
        inside a --keep folder, or a folder that holds one, is the person's
        kept data and counted apart; anything inside A or B is ignored, in
        case a snapshot was saved in a recorded folder. Exit status: 0
        nothing else differs, 1 differences, 2 a snapshot folder is missing
        or holds no records, or the arguments are wrong.

Check the check: before trusting "no trace left", make one deliberate change
(touch a file, set a setting) and see that compare reports it. A misspelled
--folder or --file is recorded as missing in both snapshots and compares
equal, which only that check catches.

Paths are recorded absolute. Tested on Linux only; it is written for
Windows paths too, but has not been run there. Snapshots stay where you save them and can
hold personal settings and file contents; look over a compare before
sharing it. Copy this file into a project's tools/ and wrap it in that
project's folders, files and commands. Python 3 standard library only.
"""
import hashlib
import os
import re
import subprocess
import sys
from collections import Counter

GROUP = re.compile(r"^\[(.*)\]$")
NAME = re.compile(r"^[A-Za-z0-9_-]+$")
RESERVED = ("files", "contents")      # compared in lower case: Windows and macOS ignore case
PATH_KINDS = ("files", "contents")    # records whose lines start with a path
ENC = dict(encoding="utf-8", errors="surrogateescape")   # odd file names must not crash a save
SEP = os.sep


def full(path):
    return os.path.abspath(os.path.expanduser(path))


def as_folder(path):
    return path if path.endswith(SEP) else path + SEP


def under(line, folders):
    """True when a record line (a path, "path/", "path -> target", "path: text",
    "path (missing)") is about one of the folders or something inside it."""
    line = os.path.normcase(line)
    for f in folders:
        f = os.path.normcase(f.rstrip(SEP) or SEP)
        if line in (f, f + " (missing)", f + " (not a folder)") or line.startswith(as_folder(f)) or \
                line.startswith(f + " -> ") or line.startswith(f + ": "):
            return True
    return False


def holds(line, folders):
    """True when the line is a folder that contains one of the folders."""
    if not line.endswith(SEP):
        return False
    line = os.path.normcase(line)
    return any(os.path.normcase(as_folder(f)).startswith(line) for f in folders)


def folder_lines(spec, skip):
    path, depth = spec, None
    m = re.match(r"^(.*):(\d+)$", spec)
    if m:
        path, depth = m.group(1), max(1, int(m.group(2)))
    top = full(path)
    if not os.path.isdir(top):
        kind = "not a folder" if os.path.lexists(top) else "missing"
        print(f"warning: {top} is {kind}{' (use --file)' if kind != 'missing' else ''}", file=sys.stderr)
        return {f"{top} ({kind})"}
    lines, base = {as_folder(top)}, top.rstrip(SEP).count(SEP)

    def unreadable(err):
        print(f"warning: cannot read {err.filename}", file=sys.stderr)

    for dp, dns, fns in os.walk(top, onerror=unreadable):
        dns[:] = [d for d in dns if not under(os.path.join(dp, d), skip)]
        for n in dns + fns:
            p = os.path.join(dp, n)
            if under(p, skip):
                continue
            if os.path.islink(p):
                lines.add(f"{p} -> {os.readlink(p)}")
            else:
                lines.add(as_folder(p) if os.path.isdir(p) else p)
        if depth is not None and dp.rstrip(SEP).count(SEP) - base + 1 >= depth:
            dns[:] = []
    return lines


def file_lines(path):
    p = full(path)
    if not os.path.lexists(p):
        return [f"{p}: (no such file)"]
    try:
        with open(p, "rb") as f:
            raw = f.read()
    except OSError as e:
        return [f"{p}: (cannot read: {e.strerror})"]
    text = raw.decode(**ENC)
    return [f"{p}: {line}" for line in text.splitlines()] + \
        [f"{p}: (checksum of the whole file {hashlib.sha256(raw).hexdigest()[:16]})"]


def command_lines(cmd):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120, errors="replace")
    except (OSError, subprocess.SubprocessError) as e:
        return [f"(could not run: {e})"]
    lines, group, ini = [], None, any(GROUP.match(x) for x in r.stdout.splitlines())
    for line in r.stdout.splitlines():
        if not line.strip():
            continue
        m = GROUP.match(line) if ini else None
        if m:
            group = m.group(1)
        else:
            lines.append(f"{group}/{line}" if ini and group is not None else line)
    if r.returncode:
        lines.append(f"(exit {r.returncode}: {r.stderr.strip()[:200]})")
    if not lines:
        print(f"warning: `{cmd}` printed nothing", file=sys.stderr)
    return lines


def fail(message):
    print(f"error: {message}", file=sys.stderr)
    return 2


def save(out, opts):
    commands = {}
    for spec in opts["--command"]:
        name, eq, cmd = spec.partition("=")
        if not eq or not cmd.strip() or not NAME.match(name) or name.lower() in RESERVED \
                or name.lower() in (n.lower() for n in commands):
            return fail(f"--command {spec!r}: give NAME=CMD, with NAME made of letters, digits, - or _, "
                        f"used once, and not {' or '.join(RESERVED)}")
        commands[name] = cmd
    if not (opts["--folder"] or opts["--file"] or commands):
        return fail("nothing to record: give --folder, --file or --command")
    out = full(out)
    if os.path.isdir(out) and os.listdir(out) or os.path.lexists(out) and not os.path.isdir(out):
        return fail(f"{out} already exists; save each snapshot to a new folder")
    if not os.path.isdir(os.path.dirname(out)):
        return fail(f"{os.path.dirname(out)} does not exist; create it before the first snapshot")
    skip = tuple(full(p) for p in opts["--skip"]) + (out,)
    parts = {}
    if opts["--folder"]:
        files = set()
        for spec in opts["--folder"]:
            files |= folder_lines(spec, skip)
        parts["files"] = files
    if opts["--file"]:
        parts["contents"] = [x for p in dict.fromkeys(opts["--file"]) for x in file_lines(p)]
    for name, cmd in commands.items():
        parts[name] = command_lines(cmd)
    os.makedirs(out, exist_ok=True)
    for name, lines in parts.items():
        with open(os.path.join(out, f"{name}.txt"), "w", **ENC) as f:
            f.write("".join(x + "\n" for x in sorted(lines)))
    print(f"saved {out}: " + ", ".join(f"{len(v)} {k}" for k, v in parts.items()))
    return 0


def read(folder, name):
    try:
        with open(os.path.join(folder, name), **ENC) as f:
            return [x for x in f.read().split("\n") if x]
    except OSError:
        return None


def compare(a, b, keep):
    names = {}
    for d in (a, b):
        found = [n for n in os.listdir(d) if n.endswith(".txt")] if os.path.isdir(d) else []
        if not found:
            return fail(f"{d} is not a snapshot (missing, or holds no records)")
        names.update(dict.fromkeys(found))
    ignore = {p for d in (a, b) for p in (full(d), os.path.realpath(d))}
    differ = 0
    for name in sorted(names):
        before, after = read(a, name), read(b, name)
        missing = [s for s, x in (("A", before), ("B", after)) if x is None]
        cb, ca = Counter(before or []), Counter(after or [])
        changed = []
        for x in sorted(set(cb) | set(ca)):
            n = ca[x] - cb[x]
            note = f"   [{cb[x]} before, {ca[x]} after]" if cb[x] and ca[x] else ""
            changed += [("-" if n < 0 else "+", x, note)] * abs(n)
        kept = []
        if name[:-4] in PATH_KINDS:
            changed = [c for c in changed if not under(c[1], ignore)]
            kept = [c for c in changed if under(c[1], keep) or holds(c[1], keep)]
            changed = [c for c in changed if c not in kept]
        status = "no change" if not changed else f"{len(changed)} changed"
        if missing:
            status += f" (not recorded in {' or '.join(missing)})"
        print(f"== {name[:-4]}: {status}")
        for sign, x, note in dict.fromkeys(changed):
            count = changed.count((sign, x, note))
            print(f"  {sign} {x}{note}" + (f"   (x{count})" if count > 1 and not note else ""))
        if kept:
            print(f"  ({len(kept)} changes in kept data)")
        differ += len(changed)
    print("\nRESULT: " + ("no trace left" if not differ else f"{differ} differences"))
    return 0 if not differ else 1


def main(argv):
    for stream in (sys.stdout, sys.stderr):   # odd file names print as \xff, not a crash
        stream.reconfigure(errors="backslashreplace")
    opts = {"--folder": [], "--file": [], "--command": [], "--skip": [], "--keep": []}
    pos, i = [], 2
    while i < len(argv):
        if argv[i] in opts and i + 1 < len(argv):
            opts[argv[i]].append(argv[i + 1])
            i += 2
        else:
            pos.append(argv[i])
            i += 1
    cmd = argv[1] if len(argv) > 1 else ""
    if cmd == "save" and len(pos) == 1:
        return save(pos[0], opts)
    if cmd == "compare" and len(pos) == 2:
        return compare(pos[0], pos[1], tuple(full(p) for p in opts["--keep"]))
    print(__doc__, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
