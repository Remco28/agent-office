# Review

A full polish review, for when someone asks for one. It takes an hour or two, and its output is a ranked list the human can decide on.

## 1. Measure

```bash
python3 <skill-folder>/measure.py <project>/lib      # or src/, or the UI folders
```

Note how many distinct values each category has against the targets in `principles.md`, the most-used values (likely the intended ones), the stragglers, near-twin colours, and named values that are also typed in literally. Numbers make the case better than adjectives: "10 text sizes, 41 colours" is a finding a human can weigh.

## 2. Look

Run the real app. Take screenshots of the main window at the normal size and at the smallest supported size. Then zoom into crops of the toolbar, each panel, the menus and the dialogs: polish problems are a few pixels wide and invisible at full-window scale. Look for:

- icons that do not match in weight or style
- controls of one kind drawn two ways
- text of slightly different sizes side by side
- edges that don't line up
- double highlights
- anything overlapping or cut off
- repeated headings

## 3. Walk the states

For each main screen:

- hover over, Tab to and click its controls
- view it with nothing selected, one thing, many things, and something locked or disabled
- empty, very long names, many items
- an error (a missing file, a failed copy)
- each way out of the app (export, copy, print), compared with the screen

## 4. Report

List the findings **worst first**: the most visible and the most often seen go first. For each one, give:

- what is wrong, in plain words
- where (file:line, or the screen and control)
- the rule it breaks, **by name**
- a suggested fix

Mark which findings are **taste**, and ask about those rather than deciding them. Keep the report to the findings that matter. A long tail of tiny ones goes in a single "small things" line.

## 5. Record and plan

Write the agreed list as a checklist in `docs/POLISH_TODO.md`, on a branch of its own:

- **Do:** the agreed items.
- **Later or maybe:** held items, with the reason.
- **How each item is checked.**

Record each taste answer in `docs/DESIGN.md`. Usually the design values come first, because every later fix builds on them. Then work through the list, showing before-and-after screenshots, and delete `POLISH_TODO.md` when it is done.
