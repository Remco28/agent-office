# Review

This is a full polish review, for when someone asks for one. It takes an hour or two, and it produces a ranked list the human can decide on.

## 1. Measure

```bash
python3 <skill-folder>/measure.py <project>/lib      # or src/, or the UI folders
```

Note how many distinct values each category has, compared with the targets in `principles.md`. Note the most-used values, which are likely the intended ones, the stragglers, near-twin colours, and named values that are also typed in literally. Numbers make the case better than adjectives. "10 text sizes, 41 colours" is a finding a human can weigh.

## 2. Look

Run the real app. Take screenshots of the main window at the normal size and at the smallest supported size. Then zoom into crops of the toolbar, each panel, the menus and the dialogs. Polish problems are a few pixels wide and invisible at full-window scale. Look for:

- icons that do not match in weight or style
- controls of one kind drawn two ways
- text of slightly different sizes side by side
- edges that don't line up
- double highlights
- anything overlapping or cut off
- repeated headings

## 3. Go through the states

For each main screen:

- hover over, Tab to and click its controls
- view it with nothing selected, one thing, many things, and something locked or disabled
- view it empty, with very long names, and with many items
- cause an error, such as a missing file or a failed copy
- compare each way out of the app, such as export, copy and print, with the screen

## 4. Report

List the findings **worst first**. The most visible and the most often seen go first. For each one, give:

- what is wrong, in plain words
- where it is, as file:line or as the screen and control
- the rule it breaks, **by name**
- a suggested fix

Mark which findings are **taste**, and ask about those instead of deciding them. Keep the report to the findings that matter. Put a long tail of tiny ones in a single "small things" line.

## 5. Record and plan

Write the agreed list as a checklist in `docs/POLISH_TODO.md`, on a branch of its own. It has three parts:

- a **Do** section with the agreed items
- a **Later or maybe** section with the held items and the reason for each
- how each item will be checked

Record each taste answer in `docs/DESIGN.md`. The design values usually come first, because every later fix builds on them. Then work through the list, show before-and-after screenshots, and delete `POLISH_TODO.md` when it is done.
