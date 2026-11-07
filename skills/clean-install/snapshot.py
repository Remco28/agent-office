#!/usr/bin/env python3
"""Record what is on a computer, and compare two records: the "leaves no trace" test.

    snapshot.py save DIR [--folder PATH[:DEPTH]]... [--file PATH]... [--command NAME=CMD]... [--skip PATH]...
    snapshot.py compare A B [--keep PATH]...

save    DIR must be new (or empty) and its parent must exist, so a save
        never mixes with an older one or creates folders of its own.
        --folder lists PATH itself (or that it is missing) and every file
        and folder under it, to DEPTH levels (1 = only what is directly in
        it), or all of it. Links, PATH included, are listed with their
        target. This shows what exists: not what is inside a file, nor its
        permissions. A folder that cannot be read is listed as such.
        --file records a file's lines (a shell profile, a settings file),
        repeats included, so a line left behind shows up, even a second
        copy of one that was already there. Its permissions and owner are
        recorded, and a checksum of the whole file: if only the checksum
        differs, the lines are the same but their order, line endings or
        final newline changed.
        --command saves the output of CMD as NAME.txt; NAME is letters,
        digits, - or _, used once, and not "files" or "contents" in any
        case. Output in INI form (`[group]` then `key=value`, as `dconf
        dump /` prints, starting with a `[group]` line) is saved one
        `group/key=value` per line. A command that fails is recorded as
        such. Command output is compared ignoring line order.
        --skip leaves out a folder and everything in it. DIR is always
        left out.
compare prints what is in A and not in B (-) and in B and not in A (+),
        counting repeated lines. For listed paths and file lines: what was
        added inside a --keep folder is the person's kept data and counted
        apart, as are the folders that hold kept data present in B; what
        was removed from a --keep folder is a difference ("kept data
        removed"). Paths inside A or B themselves are ignored. A kind of
        record found in only one snapshot is a difference, and a path that
        could not be read in either leaves the result unproven. Exit
        status: 0 nothing else differs, 1 differences or unproven, 2 a
        snapshot folder is missing or holds no records, or the arguments
        are wrong.

Check the check: before trusting "no trace left", make one deliberate change
(touch a file, set a setting) and see that compare reports it. A misspelled
--folder or --file is recorded as missing in both snapshots and compares
equal, which only that check catches. Save snapshots outside the folders you
record: compare ignores A and B, not other snapshots saved in between.

Paths are recorded absolute. Tested on Linux only; it is written for
Windows paths too, but has not been run there. Snapshots stay where you save them and can
hold personal settings and file contents; look over a compare before
sharing it. Copy this file into a project's tools/ and wrap it in that
project's folders, files and commands. Python 3 standard library only.
"""
import hashlib
import os
import re
import stat
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


MARKS = (" (missing)", " (not a folder)", " (cannot read)")


def esc(path):
    """One record per line: a newline in a file name must not split it."""
    return path.replace("\n", "\\n").replace("\r", "\\r")


def under(line, folders, kind):
    """True when a record line is about one of the folders or something inside
    it. files lines are "path", "path/", "path -> target" or "path (missing)";
    contents lines are "path: text"."""
    line = os.path.normcase(line)
    for f in folders:
        f = os.path.normcase(esc(f).rstrip(SEP) or SEP)
        if line.startswith(as_folder(f)):
            return True
        if kind == "files" and (line == f or line.startswith(f + " -> ") or
                                any(line == f + m for m in MARKS)):
            return True
        if kind == "contents" and line.startswith(f + ": "):
            return True
    return False


def holds(line, folders):
    """True when the line is a folder ("path/" or "path (missing)") that
    contains one of the folders."""
    if line.endswith(" (missing)"):
        line = line[:-len(" (missing)")]
    elif not line.endswith(SEP):
        return False
    p = os.path.normcase(as_folder(line))
    return any(os.path.normcase(as_folder(esc(f))).startswith(p) for f in folders)


def judge(sign, line, kind, keep, present):
    """Is a changed path record kept data, kept data removed, or a trace?"""
    appeared = sign == "+" or line.endswith(" (missing)")   # "- x (missing)": x now exists
    if under(line, keep, kind):
        return "kept" if appeared else "removed"
    if appeared and holds(line, present):
        return "kept"
    return "trace"


def folder_lines(spec, skip):
    path, depth = spec, None
    m = re.match(r"^(.*):(\d+)$", spec)
    if m:
        path, depth = m.group(1), max(1, int(m.group(2)))
    top = full(path)
    if not os.path.isdir(top):
        kind = "not a folder" if os.path.lexists(top) else "missing"
        print(f"warning: {top} is {kind}{' (use --file)' if kind != 'missing' else ''}", file=sys.stderr)
        return {f"{esc(top)} ({kind})"}
    root = f"{top} -> {os.readlink(top)}" if os.path.islink(top) else as_folder(top)
    lines, base = {esc(root)}, top.rstrip(SEP).count(SEP)

    def unreadable(err):
        print(f"warning: cannot read {err.filename}; changes there will not be seen", file=sys.stderr)
        lines.add(f"{esc(err.filename)} (cannot read)")

    for dp, dns, fns in os.walk(top, onerror=unreadable):
        dns[:] = [d for d in dns if not under(os.path.join(dp, d), skip, "files")]
        for n in dns + fns:
            p = os.path.join(dp, n)
            if under(p, skip, "files"):
                continue
            if os.path.islink(p):
                lines.add(esc(f"{p} -> {os.readlink(p)}"))
            else:
                lines.add(esc(as_folder(p) if os.path.isdir(p) else p))
        if depth is not None and dp.rstrip(SEP).count(SEP) - base + 1 >= depth:
            dns[:] = []
    return lines


def file_lines(path):
    p = full(path)
    name = esc(p)
    if not os.path.lexists(p):
        return [f"{name}: (no such file)"]
    try:
        st = os.stat(p)
        with open(p, "rb") as f:
            raw = f.read()
    except OSError as e:
        print(f"warning: cannot read {p}; changes to it will not be seen", file=sys.stderr)
        return [f"{name}: (cannot read: {e.strerror})"]
    text = raw.decode(**ENC)
    return [f"{name}: {line}" for line in text.splitlines()] + [
        f"{name}: (mode {stat.filemode(st.st_mode)}, owner {st.st_uid}:{st.st_gid})",
        f"{name}: (checksum of the whole file {hashlib.sha256(raw).hexdigest()[:16]})"]


def command_lines(cmd):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120, errors="replace")
    except (OSError, subprocess.SubprocessError) as e:
        return [f"(could not run: {e})"]
    first = next((x for x in r.stdout.splitlines() if x.strip()), "")
    lines, group, ini = [], None, bool(GROUP.match(first))
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
    records = {n: (read(a, n), read(b, n)) for n in sorted(names)}
    # kept folders that hold something in B: only their parents count as kept
    present = [k for k in keep if any(
        under(x, (as_folder(k),), n[:-4]) for n, (_, after) in records.items()
        if n[:-4] in PATH_KINDS for x in after or [])]
    differ, unreadable = 0, set()
    for name, (before, after) in records.items():
        kind = name[:-4]
        missing = [s for s, x in (("A", before), ("B", after)) if x is None]
        cb, ca = Counter(before or []), Counter(after or [])
        changed = []
        for x in sorted(set(cb) | set(ca)):
            n = ca[x] - cb[x]
            note = f"   [{cb[x]} before, {ca[x]} after]" if cb[x] and ca[x] else ""
            changed += [("-" if n < 0 else "+", x, note)] * abs(n)
        kept = []
        if kind in PATH_KINDS:
            unreadable |= {x for x in set(cb) | set(ca) if not under(x, ignore, kind) and
                           (x.endswith(" (cannot read)") or ": (cannot read: " in x)}
            changed = [c for c in changed if not under(c[1], ignore, kind)]
            verdict = [judge(c[0], c[1], kind, keep, present) for c in changed]
            kept = [c for c, v in zip(changed, verdict) if v == "kept"]
            changed = [c if v == "trace" else (c[0], c[1], c[2] + "   (kept data removed)")
                       for c, v in zip(changed, verdict) if v != "kept"]
        status = "no change" if not changed else f"{len(changed)} changed"
        if missing:
            status += f"; not recorded in {' or '.join(missing)}, so it counts as a difference"
        print(f"== {kind}: {status}")
        for sign, x, note in dict.fromkeys(changed):
            count = changed.count((sign, x, note))
            print(f"  {sign} {x}{note}" + (f"   (x{count})" if count > 1 and not note else ""))
        if kept:
            print(f"  ({len(kept)} changes in kept data)")
        differ += len(changed) + bool(missing)
    if unreadable:
        print(f"== unreadable: {len(unreadable)} could not be read in A or B, so changes there are unknown")
        for x in sorted(unreadable):
            print(f"  ? {x}")
    print("\nRESULT: " + ("no trace left" if not differ and not unreadable else
                          f"{differ} differences" + (f", not proven: {len(unreadable)} unreadable" if unreadable else "")))
    return 0 if not differ and not unreadable else 1


def main(argv):
    for stream in (sys.stdout, sys.stderr):   # odd file names print as \udcff, not a crash
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
