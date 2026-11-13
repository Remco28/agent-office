---
name: clean-install
description: Make software that gets installed on people's computers install, upgrade and uninstall cleanly, leaving the computer as it was. Use automatically when writing or changing an installer, setup or first-run step, uninstaller, package such as a .deb, .rpm, Homebrew formula, MSI or globally installed pip/npm tool, or anything the software adds to a computer outside its own folder, such as settings, shell profile lines, services, scheduled jobs and startup entries. Also use it when asked to make install or uninstall clean, safe or reversible, or to check that an uninstall leaves no trace. Skip it for setting up your own development environment, and for code that only runs as a service, plugin or scheduled job without changing how it is installed.
---

# Clean install

An install changes someone else's computer. A clean uninstall puts it back.
It leaves no files or folders behind, leaves no settings changed and breaks
nothing. It keeps the person's own data unless they ask for it to go. You
cannot add that at the end. You can only undo what you recorded when you made
the change, so you have to design clean removal in at install time.

[`principles.md`](principles.md) holds the rules. [`testing.md`](testing.md)
explains how to prove an uninstall leaves no trace, in tests and on a real
computer. [`snapshot.py`](snapshot.py) records a computer's state and compares
two records, and [`test-snapshot.sh`](test-snapshot.sh) tests it.

## The skill holds the method; the project holds the details

Every project touches different things, so this skill has no list of files or
settings. Each project keeps its own **footprint**. The footprint is a table of
every change the project's install makes and what undoes it, usually in the
README under "What the installer changes". Read it before changing the
installer, and update it in the same change. If there is none, write it first,
as principle 1 says.

## While building, always

Whenever you add or change something that installs, sets up or removes:

1. Add the change to the footprint, with what undoes it.
2. Decide which of the four kinds of change it is, as principle 2 describes.
   Each kind has its own rule for uninstall.
3. Write the undo in the same change as the do. Have the installer record the
   change in its ledger as it makes it, as principle 4 says.
4. Prefer a way of installing that undoes itself, as principle 3 says.
5. Check how the software can leave without your uninstaller, and check that
   what stays is harmless, as principle 6 says.
6. Extend the "leaves no trace" test to cover the change, as `testing.md`
   explains.

Keep this light. One new setting needs its row, its undo and its test, not a
review of the whole installer.

## When asked to check or make an install clean

1. Write or read the footprint.
2. Run the snapshot test in a sandbox, after checking that the test can fail.
   `testing.md` explains how.
3. Fix each difference, worst first. Fix anything broken or destroyed, then
   settings left changed, then leftover files, then empty folders.
4. A sandbox cannot imitate a real desktop, real services or a real package
   manager. For those, run the same cycle on a real computer.
5. Ask the human about real choices, such as whether the app keeps history by
   default, and record the answer in the project's docs.

## Improving this skill

When a project finds a kind of trace these rules do not cover, add the general
lesson to `principles.md` in agent-office, where this skill is kept. Add only
the lesson, never the project's specifics.
When `snapshot.py` misses a trace or reports a false one, add the case to
`test-snapshot.sh` before fixing the script.
