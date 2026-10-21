#!/usr/bin/env python3
"""Count the design values a codebase really uses.

    python3 measure.py [path ...] [--json] [--top N] [--include-tests]

Walks Dart and CSS-like files (.dart, .css, .scss, .less, .html, .vue, .svelte,
.js, .jsx, .ts, .tsx) and reports, per category, how many distinct values are
used and where: text sizes, colours, corner roundings, icon sizes, spacing and
durations. It also flags near-twin colours and named colours that are typed
in literally elsewhere. Standard library only.

The counts are evidence for a review, not a verdict: a value used once may be
deliberate. Compare them with the targets in principles.md.
"""

import argparse
import json
import os
import re
import sys
from collections import defaultdict

SKIP_DIRS = {
    ".git", "node_modules", "build", "dist", ".dart_tool", "ephemeral",
    "vendor", ".venv", "venv", "__pycache__", "coverage", ".next", "out",
    "target", "Pods",
}
TEST_DIRS = {"test", "tests", "__tests__", "spec", "integration_test"}
DART = {".dart"}
WEB = {".css", ".scss", ".less", ".html", ".vue", ".svelte", ".js", ".jsx", ".ts", ".tsx"}

NUM = r"(\d+(?:\.\d+)?)"

# (category, pattern, value-group) per language. Patterns stay simple on
# purpose: they find the common ways values are written, and the report shows
# file:line so anything odd can be looked at.
DART_RULES = [
    ("text size", re.compile(r"fontSize:\s*" + NUM)),
    ("corner rounding", re.compile(r"(?:Radius\.)?circular\(\s*" + NUM + r"\s*\)")),
    ("icon size", re.compile(r"Icon\([^;]{0,160}?\bsize:\s*" + NUM, re.S)),
    ("duration (ms)", re.compile(r"Duration\(\s*milliseconds:\s*(\d+)")),
    ("spacing", re.compile(r"EdgeInsets\.(?:all|only|symmetric|fromLTRB)\(([^)]*)\)")),
    ("spacing", re.compile(r"SizedBox\(\s*(?:width|height):\s*" + NUM)),
]
WEB_RULES = [
    ("text size", re.compile(r"font-size\s*:\s*([\d.]+(?:px|rem|em|pt))")),
    ("corner rounding", re.compile(r"border-radius\s*:\s*([^;}\n]+)")),
    ("duration (ms)", re.compile(r"(?:transition|animation)(?:-duration)?\s*:[^;}\n]*?(\d*\.?\d+m?s)\b")),
    ("spacing", re.compile(r"(?:margin|padding|gap)(?:-[a-z]+)?\s*:\s*([^;}\n]+)")),
]
DART_COLOUR = re.compile(r"Color\(\s*0x([0-9A-Fa-f]{8})\s*\)")
DART_NAMED = re.compile(r"(?:const|final)\s+(?:Color\s+)?(\w+)\s*=\s*(?:const\s+)?Color\(\s*0x([0-9A-Fa-f]{8})\s*\)")
WEB_COLOUR = re.compile(r"#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b|\b(rgba?\([^)]*\)|hsla?\([^)]*\))")
WEB_NAMED = re.compile(r"(--[\w-]+)\s*:\s*#([0-9A-Fa-f]{3,8})\b")


def norm_hex(h):
    """#abc, #aabbcc, #aabbccdd and Flutter's AARRGGBB, all as AARRGGBB."""
    h = h.upper()
    if len(h) == 3:
        return "FF" + "".join(c * 2 for c in h)
    if len(h) == 6:
        return "FF" + h
    return h


def css_hex8(h):
    """CSS #RRGGBBAA to AARRGGBB."""
    h = h.upper()
    return h[6:8] + h[0:6] if len(h) == 8 else norm_hex(h)


def rgb_of(argb):
    return tuple(int(argb[i:i + 2], 16) for i in (2, 4, 6))


def files_under(paths, include_tests):
    for root in paths:
        if os.path.isfile(root):
            yield root
            continue
        for dirpath, dirs, names in os.walk(root):
            dirs[:] = [
                d for d in dirs
                if d not in SKIP_DIRS and (include_tests or d not in TEST_DIRS)
            ]
            for n in names:
                ext = os.path.splitext(n)[1]
                if ext in DART or ext in WEB:
                    yield os.path.join(dirpath, n)


def line_of(text, pos):
    return text.count("\n", 0, pos) + 1


def scan(paths, include_tests):
    uses = defaultdict(lambda: defaultdict(list))  # category -> value -> [loc]
    named = {}  # AARRGGBB -> name, for colours defined under a name
    named_at = set()  # locations of those definitions
    for path in files_under(paths, include_tests):
        try:
            text = open(path, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        ext = os.path.splitext(path)[1]
        dart = ext in DART

        def add(cat, value, pos):
            uses[cat][value].append(f"{path}:{line_of(text, pos)}")

        for cat, rx in (DART_RULES if dart else WEB_RULES):
            for m in rx.finditer(text):
                raw = m.group(1).strip()
                if cat == "spacing" and dart and "EdgeInsets" in m.group(0):
                    for v in re.findall(NUM, raw):
                        add(cat, v, m.start())
                elif cat == "spacing" and not dart:
                    for v in re.findall(r"-?\d*\.?\d+(?:px|rem|em)", raw):
                        add(cat, v, m.start())
                else:
                    add(cat, raw, m.start())
        if dart:
            for m in DART_NAMED.finditer(text):
                named.setdefault(m.group(2).upper(), m.group(1))
                named_at.add(f"{path}:{line_of(text, m.start())}")
            for m in DART_COLOUR.finditer(text):
                add("colour", m.group(1).upper(), m.start())
        else:
            for m in WEB_NAMED.finditer(text):
                named.setdefault(css_hex8(m.group(2)), m.group(1))
                named_at.add(f"{path}:{line_of(text, m.start())}")
            for m in WEB_COLOUR.finditer(text):
                value = css_hex8(m.group(1)) if m.group(1) else re.sub(r"\s+", "", m.group(2))
                add("colour", value, m.start())
    return uses, named, named_at


def near_twins(colours, limit=10):
    """Pairs of opaque-ish hex colours within a small RGB distance."""
    hexes = [c for c in colours if re.fullmatch(r"[0-9A-F]{8}", c) and int(c[:2], 16) > 0xF0]
    out = []
    for i, a in enumerate(hexes):
        for b in hexes[i + 1:]:
            ra, rb = rgb_of(a), rgb_of(b)
            d = sum((x - y) ** 2 for x, y in zip(ra, rb)) ** 0.5
            if 0 < d <= limit:
                out.append((a, b, round(d, 1)))
    return sorted(out, key=lambda t: t[2])


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("paths", nargs="*", default=["."])
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    ap.add_argument("--top", type=int, default=12, help="values to show per category")
    ap.add_argument("--include-tests", action="store_true")
    args = ap.parse_args()

    uses, named, named_at = scan(args.paths, args.include_tests)
    literal_copies = []
    for value, locs in uses.get("colour", {}).items():
        if value in named:
            extra = [l for l in locs if l not in named_at]
            if extra:
                literal_copies.append((named[value], value, len(extra), extra[:3]))
    twins = near_twins(uses.get("colour", {}).keys())

    if args.json:
        json.dump({
            "categories": {
                cat: {v: {"count": len(l), "at": l[:5]} for v, l in vals.items()}
                for cat, vals in uses.items()
            },
            "literal_copies_of_named_colours": [
                {"name": n, "value": v, "count": c, "at": at} for n, v, c, at in literal_copies
            ],
            "near_twin_colours": [{"a": a, "b": b, "distance": d} for a, b, d in twins],
        }, sys.stdout, indent=2)
        print()
        return

    order = ["text size", "colour", "corner rounding", "icon size", "spacing", "duration (ms)"]
    for cat in order + sorted(set(uses) - set(order)):
        vals = uses.get(cat)
        if not vals:
            continue
        ranked = sorted(vals.items(), key=lambda kv: (-len(kv[1]), kv[0]))
        print(f"\n{cat}: {len(vals)} distinct, {sum(len(l) for l in vals.values())} uses")
        for v, locs in ranked[: args.top]:
            label = f"{v} ({named[v]})" if cat == "colour" and v in named else v
            print(f"  {len(locs):4}  {label:<28} {locs[0]}")
        if len(ranked) > args.top:
            once = sum(1 for _, l in ranked if len(l) == 1)
            print(f"        … {len(ranked) - args.top} more ({once} used only once overall)")
    if literal_copies:
        print("\nnamed colours also typed in literally:")
        for name, value, count, at in sorted(literal_copies, key=lambda t: -t[2]):
            print(f"  {count:4}  {name} = {value}   e.g. {at[0]}")
    if twins:
        print("\nnear-twin colours (likely meant to be one):")
        for a, b, d in twins[:15]:
            print(f"        {a}  {b}   distance {d}")


if __name__ == "__main__":
    main()
