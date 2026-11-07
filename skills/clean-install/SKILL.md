---
name: clean-install
description: Make software that gets installed on people's computers install, upgrade and uninstall cleanly, leaving the computer as it was. Use automatically when writing or changing an installer, setup or first-run step, uninstaller, package (.deb, .rpm, Homebrew, MSI, a globally installed pip/npm tool), or anything the software adds to a computer outside its own folder (settings, shell profile lines, services, scheduled jobs, startup entries); and when asked to make install or uninstall clean, safe or reversible, or to check that an uninstall leaves no trace. Skip it for setting up your own development environment, and for code that merely runs as a service, plugin or scheduled job without changing how it is installed.
---

# Clean install

An install changes someone else's computer. A clean uninstall puts it back:
no leftover files or folders, no settings left changed, nothing broken, and
the person's own data kept unless they ask for it gone. That cannot be added
at the end. You can only undo what you recorded when you made the change, so
clean removal is designed in at install time.

The rules are in [`principles.md`](principles.md). How to prove an uninstall
leaves no trace, in tests and on a real computer, is in
[`testing.md`](testing.md). [`snapshot.py`](snapshot.py) records a computer's
state and compares two records.

## The skill holds the method; the project holds the details

Every project touches different things, so this skill has no list of files or
settings. Each project keeps its own **footprint**: a table of every change
its install makes and what undoes it, usually in the README under "What the
installer changes". Read it before changing the installer, and update it in
the same change. If there is none, write it first (principle 1).

## While building (always)

Whenever you add or change something that installs, sets up or removes:

1. Add the change to the footprint, with what undoes it.
2. Decide which of the four kinds it is (principle 2); each kind has its own
   rule for uninstall.
3. Write the undo in the same change as the do, and have the installer record
   the change in its ledger as it makes it (principle 4).
4. Prefer a way of installing that undoes itself (principle 3).
5. Check how the software can leave without your uninstaller, and that what
   stays is harmless (principle 6).
6. Extend the "leaves no trace" test to cover the change (`testing.md`).

Keep this light: one new setting needs its row, its undo and its test, not a
review of the whole installer.

## When asked to check or make an install clean

1. Write or read the footprint.
2. Run the snapshot test in a sandbox, after checking that it can fail
   (`testing.md`).
3. Fix each difference, worst first: anything broken or destroyed, then
   settings left changed, then leftover files, then empty folders.
4. For what a sandbox cannot imitate (a real desktop, real services, a real
   package manager), run the same cycle on a real computer.
5. Ask the human about real choices, such as whether history is kept by
   default, and record the answer in the project's docs.

## Improving this skill

When a project finds a kind of trace these rules do not cover, add the general
lesson to `principles.md` (in agent-office, where this skill is kept): the
lesson only, never the project's specifics.
