# Proving an uninstall leaves no trace

The test is the same everywhere: **snapshot, install, use, uninstall,
snapshot, compare.** Any difference that is not the person's kept data is a
trace. The work is in choosing what to record, keeping the sandbox sealed,
and making sure the check can fail.

## What to record

Record the places this project's footprint touches, plus their parent folders
and the obvious neighbours (a new sibling folder is a trace too). There are
three kinds of record, and a trace can hide in any of them:

- **Which files and folders exist** (`snapshot.py --folder`): everything under
  the app's own folders, one level under shared ones like `~/.config`.
- **What is inside files the install edits** (`--file`): shell profiles,
  `~/.gitconfig`, editor settings files, shared config files. A folder
  listing proves a file exists, not that its content is back.
- **What managers report** (`--command`): settings stores, services,
  scheduled jobs, installed packages.

Common places:

| Platform | Folders | Files and managers |
|---|---|---|
| Linux | `/usr/local`, `/opt`, the parts of `/etc` you touch, the package's paths, `~/.config`, `~/.local/share`, `~/.local/state`, `~/.cache`, `~/.config/autostart`, `~/.config/systemd/user` | `dconf dump /` (GNOME), `systemctl list-unit-files` (and `--user`), `crontab -l`, `dpkg -l` or `rpm -qa` |
| macOS | `/Applications`, `/usr/local` or `/opt/homebrew`, `~/Library/Application Support`, `~/Library/Preferences`, `~/Library/Caches`, `~/Library/LaunchAgents` | `defaults read <domain>`, `brew list`, `launchctl list` (its PIDs change between runs; compare only the labels) |
| Windows | `Program Files`, `%APPDATA%`, `%LOCALAPPDATA%`, the Start menu and Startup folders | `reg query <key> /s` for the keys you touch (`reg export` cannot print to the screen), scheduled tasks, services |
| Any | editor extension folders, global package folders (npm, pip, cargo) | shell profiles, `~/.gitconfig`, editor `settings.json`, `npm ls -g`, `pip list` |

Leave out caches that belong to other programs (graphics shader caches, for
example) and say so in the test.

## Check the check

A snapshot that sees nothing passes every time. Before trusting "no trace
left", make one deliberate change of each kind (create a file, add a line,
set a setting) between two snapshots and see the compare report it. In
particular, read settings from the store the test actually writes to: a
sandbox that keeps settings in a file is invisible to a command that reads
the real store (on GNOME, `GSETTINGS_BACKEND=keyfile` writes to
`$XDG_CONFIG_HOME/glib-2.0/settings/keyfile`, which `dconf dump` never shows).

## In a sandbox, for every change

Run the real installer and uninstaller, not a re-implementation, against a
temporary computer:

- **Every location in a temporary folder:** HOME, every XDG or platform data
  folder, and an install root option (`--root DIR`, `DESTDIR`, `--prefix`) so
  system paths land there too. Check that *every* variable is redirected
  before adding a step that deletes anything: a test that missed one would
  delete real data.
- **A throwaway settings store** (a keyfile backend, a temporary registry
  hive, a mocked settings layer), with whatever it needs to find the app's
  setting definitions.
- **Stubs for outside programs** the installer calls (services, daemons,
  package tools), whose answers each test sets.
- **Only the folders a new account has:** create the base folders every real
  home has (on Linux `~/.config`, `~/.cache`, `~/.local/state`) so the test
  does not flag them, but never a folder the installer itself might create:
  that would hide a leftover empty folder.

Tests worth having for every project:

1. Install, use, uninstall: nothing differs except the person's kept data.
2. The same with `--purge` (or the "delete my data" choice): nothing differs.
3. Folders, files and packages that existed before the install are still
   there after it, unchanged.
4. Uninstall twice; the second run changes nothing and does not fail.
5. A dry run changes nothing.
6. Uninstall after a half-finished install.
7. A setting the person changed after the install is left as they set it.
8. Install over an older version, then uninstall: nothing of either is left.
   An upgrade alone undoes none of the person's settings.
9. Remove the app *without* the uninstaller (delete its files, or remove the
   package), then start a new shell or login and ask each manager for its
   status: nothing errors, nothing runs.

Compare settings as values, not as file text, so a reset that leaves an empty
section header in a settings file does not count as a trace.

## On a real computer, at each release

A sandbox cannot imitate a real desktop, real services or a real package
manager. Once per release, or when the installer changes in a way the sandbox
cannot see, run the same cycle on a real computer:

1. Remove any current install, then list leftovers from older versions. Show
   the list to the person and let them decide what to remove by hand.
2. Snapshot A.
3. Install, do whatever setup needs (log out and in, restart), use the app.
4. Uninstall, snapshot B, compare A with B.
5. Reinstall if it is in daily use.

Never use `--purge` on someone's real data unless they ask for it. Expect
differences from other programs used in between, and ask which look like the
app's. If the tester is not the developer, give each command with the folder
to run it in, say where the snapshots are kept and what would delete them,
and say that they stay on the computer (the `human-feedback` skill, where
available, packages this as a test guide).

[`snapshot.py`](snapshot.py) does the recording and comparing:

```
python3 snapshot.py save A --folder /usr/local --folder ~/.config:1 \
    --file ~/.bashrc --command settings="dconf dump /"
python3 snapshot.py compare A B --keep ~/.local/state/myapp
```

Copy it into the project's `tools/` and wrap it in the project's folders,
files and commands, so each step is one short command.
