#!/usr/bin/env python3
"""Record what is on a computer, and compare two records: the "leaves no trace" test.

    snapshot.py save DIR [--folder PATH[:DEPTH]]... [--file PATH]... [--command NAME=CMD]... [--skip PATH]...
    snapshot.py compare A B [--keep PATH]...

save    --folder lists every file and folder under PATH, to DEPTH levels
        (1 = only what is directly in it), or all of it. Links are listed
        with their target. This shows what exists, not what is inside.
        --file records a file's lines (a shell profile, a settings file), so
        a line left behind shows up. A repeated line is counted ("(copy 2)"),
        so a second copy of a line that was already there shows up too.
        --command saves the output of CMD as NAME.txt; NAME is letters,
        digits, - or _, and not "files" or "contents". Output in INI form
        (`[group]` then `key=value`, as `dconf dump /` prints) is saved one
        `group/key=value` per line, and repeated lines are counted. A command
        that fails is recorded as such.
        --skip leaves out a folder and everything in it. DIR itself is
        always left out.
compare prints what is in A and not in B (-) and in B and not in A (+).
        Changes inside a --keep folder (the person's kept data) are counted
        apart. Paths inside A or B themselves are ignored, in case a
        snapshot was saved inside a recorded folder. Exit status: 0 nothing
        else differs, 1 differences, 2 a snapshot is missing or empty, or the
        arguments are wrong.

Check the check: before trusting "no trace left", make one deliberate change
(touch a file, set a setting) and see that compare reports it.

Paths are recorded absolute. Snapshots stay where you save them and can hold personal settings and file
contents; look over a compare before sharing it. Copy this file into a
project's tools/ and wrap it in that project's folders, files and commands.
Python 3 standard library only.
"""
import os
import re
import subprocess
import sys

GROUP = re.compile(r"^\[(.*)\]$")
NAME = re.compile(r"^[A-Za-z0-9_-]+$")
RESERVED = ("files", "contents")
ENC = dict(encoding="utf-8", errors="surrogateescape")   # odd file names must not crash a save


def under(path, folders):
    return any(path == f or path.startswith(f.rstrip("/") + "/") for f in folders)


def full(path):
    return os.path.abspath(os.path.expanduser(path))


def counted(lines):
    """Number repeats, so a second copy of a line is a difference, not a no-op."""
    seen, out = {}, []
    for line in lines:
        seen[line] = seen.get(line, 0) + 1
        out.append(line if seen[line] == 1 else f"{line} (copy {seen[line]})")
    return out


def folder_lines(spec, skip):
    path, depth = spec, None
    m = re.match(r"^(.*):(\d+)$", spec)
    if m:
        path, depth = m.group(1), max(1, int(m.group(2)))
    top = full(path)
    if not os.path.isdir(top):
        print(f"warning: {top} is not a folder ({'use --file' if os.path.isfile(top) else 'missing'})",
              file=sys.stderr)
        return set()
    lines, base = set(), top.rstrip("/").count("/")

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
                lines.add(p + ("/" if os.path.isdir(p) else ""))
        if depth is not None and dp.rstrip("/").count("/") - base + 1 >= depth:
            dns[:] = []
    return lines


def file_lines(path):
    p = full(path)
    if not os.path.lexists(p):
        return {f"{p}: (no such file)"}
    try:
        with open(p, **ENC) as f:
            return {f"{p}: {line}" for line in counted(f.read().splitlines())} or {f"{p}: (empty)"}
    except OSError as e:
        return {f"{p}: (cannot read: {e.strerror})"}


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
    return sorted(counted(lines))


def save(out, opts):
    commands = {}
    for spec in opts["--command"]:
        name, eq, cmd = spec.partition("=")
        if not eq or not cmd.strip() or not NAME.match(name) or name in RESERVED or name in commands:
            print(f"error: --command {spec!r}: give NAME=CMD, with NAME made of letters, digits, - or _, "
                  f"used once, and not {' or '.join(RESERVED)}", file=sys.stderr)
            return 2
        commands[name] = cmd
    skip = tuple(full(p) for p in opts["--skip"]) + (full(out),)
    files = set()
    for spec in opts["--folder"]:
        files |= folder_lines(spec, skip)
    parts = {"files": sorted(files)}
    if opts["--file"]:
        parts["contents"] = sorted(set().union(*(file_lines(p) for p in opts["--file"])))
    for name, cmd in commands.items():
        parts[name] = command_lines(cmd)
    os.makedirs(out, exist_ok=True)
    for name, lines in parts.items():
        with open(os.path.join(out, f"{name}.txt"), "w", **ENC) as f:
            f.write("".join(x + "\n" for x in lines))
    print(f"saved {out}: " + ", ".join(f"{len(v)} {k}" for k, v in parts.items()))
    return 0


def read(folder, name):
    try:
        with open(os.path.join(folder, name), **ENC) as f:
            return [x for x in f.read().splitlines() if x]
    except OSError:
        return []


def path_of(line):
    return re.split(r" -> |: ", line)[0].rstrip("/")


def compare(a, b, keep):
    names = {}
    for d in (a, b):
        found = [n for n in os.listdir(d) if n.endswith(".txt")] if os.path.isdir(d) else []
        if not found:
            print(f"error: {d} is not a snapshot (missing or empty)", file=sys.stderr)
            return 2
        names.update(dict.fromkeys(found))
    differ = 0
    for name in sorted(names):
        before, after = read(a, name), read(b, name)
        sb, sa = set(before), set(after)
        changed = [("-", x) for x in before if x not in sa] + [("+", x) for x in after if x not in sb]
        # a path, "path -> target" or "path: line": the snapshots themselves are
        # ignored, and anything inside a kept folder is kept data
        changed = [c for c in changed if not under(path_of(c[1]), (full(a), full(b)))]
        kept = [c for c in changed if under(path_of(c[1]), keep)]
        changed = [c for c in changed if c not in kept]
        print(f"== {name[:-4]}: " + ("no change" if not changed else f"{len(changed)} changed"))
        for sign, x in changed:
            print(f"  {sign} {x}")
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
