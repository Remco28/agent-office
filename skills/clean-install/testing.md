# Proving an uninstall leaves no trace

The test is the same everywhere: **snapshot, install, use, uninstall,
snapshot, compare.** Any difference that is not the person's kept data is a
trace. The work is in choosing what to record, keeping the sandbox sealed,
and making sure the check can fail.

## What to record

Record the places this project's footprint touches, plus their parent folders
and the nearby folders. A new sibling folder is a trace too. There are three
kinds of record, and a trace can hide in any of them.

- **Which files and folders exist**, recorded with `snapshot.py --folder`.
  Record everything under the app's own folders, and one level under shared
  ones like `~/.config`.
- **What is inside files the install edits**, recorded with `--file`. These
  are shell profiles, `~/.gitconfig`, editor settings files and shared config
  files. A folder listing proves a file exists, not that its content or
  permissions are back. `--file` records the lines, the permissions and owner,
  a link's target and a checksum, so use it for every file that must come
  back unchanged. Inside a kept folder, only a file's disappearing counts,
  because changes to its content are the person's.
  The snapshot counts repeated lines, so it catches a second copy of a line
  the person already had.
- **What managers report**, recorded with `--command`. That covers settings
  stores, services, scheduled jobs and installed packages. The compare
  ignores the order of output lines. Where order matters, as in `PATH`, print
  one entry per line with its position, for example
  `echo "$PATH" | tr : '\n' | nl`.

A path the snapshot cannot read leaves the result unproven, not clean. Run
the snapshot with the rights to read what the installer touches, and `--skip`
a folder that you cannot read and the installer does not touch. Under `sudo`,
`~` and `$HOME` usually mean root's home, and `systemctl --user`, `dconf` and
`crontab -l` read root's settings. Those compare equal and prove nothing.
Give the person's paths in full, and run their per-person commands as them.

Common places:

| Platform | Folders | Files and managers |
|---|---|---|
| Linux | `/usr/local`, `/opt`, the parts of `/etc` you touch, the package's paths, `~/.config`, `~/.local/share`, `~/.local/state`, `~/.cache`, `~/.config/autostart`, `~/.config/systemd/user` | `dconf dump /` on GNOME, `systemctl list-unit-files` and its `--user` form for unit files, `systemctl list-units --all '<app>*'` and its `--user` form for units still loaded or running without a unit file, `crontab -l`, `dpkg -l` or `rpm -qa` |
| macOS | `/Applications`, `/usr/local` or `/opt/homebrew`, `~/Library/Application Support`, `~/Library/Preferences`, `~/Library/Caches`, `~/Library/LaunchAgents` | `defaults read <domain>`, `brew list`, `launchctl list`. Its PIDs change between runs, so compare only the labels |
| Windows | `Program Files`, `%APPDATA%`, `%LOCALAPPDATA%`, the Start menu and Startup folders | `reg query <key> /s` for the keys you touch, because `reg export` cannot print to the screen. Also scheduled tasks and services |
| Any | editor extension folders, global package folders for npm, pip and cargo | shell profiles, `~/.gitconfig`, editor `settings.json`, `npm ls -g`, `pip list` |

Leave out caches that belong to other programs, such as graphics shader
caches, and say so in the test.

## Check the check

A snapshot that sees nothing passes every time. Before you trust "no trace
left", make one deliberate change of each kind between two snapshots. Create a
file, add a line and set a setting, and see the compare report each one. In
particular, read settings from the store the test actually writes to. A
command that reads the real store cannot see a sandbox that keeps settings in
a file. On GNOME, for example, `GSETTINGS_BACKEND=keyfile` writes to
`$XDG_CONFIG_HOME/glib-2.0/settings/keyfile`, which `dconf dump` never shows.

## In a sandbox, for every change

Run the real installer and uninstaller, not a re-implementation, against a
temporary computer:

- **Every location in a temporary folder.** Redirect HOME, every XDG or
  platform data folder, and an install root option such as `--root DIR`,
  `DESTDIR` or `--prefix`, so system paths land there too. Check that *every*
  variable is redirected before adding a step that deletes anything. A test
  that missed one would delete real data.
- **A throwaway settings store**, such as a keyfile backend, a temporary
  registry hive or a mocked settings layer. Give it whatever it needs to find
  the app's setting definitions.
- **Stubs for outside programs** the installer calls, such as services,
  daemons and package tools. Each test sets the stubs' answers.
- **Only the folders a new account has.** Create the base folders that the
  accounts you install for already have. On a Linux desktop, `~/.config` and
  `~/.cache` exist after the first login, so create those and the test does
  not flag them. Never create a folder that an account may lack, or that the
  installer itself might create. A new account often has no `~/.local/state`
  yet, for example. Creating such a folder would hide a leftover empty folder.

Tests worth having for every project:

1. Install, use and uninstall. Nothing differs except the person's kept data.
2. Do the same with `--purge` or the "delete my data" choice. Nothing differs.
3. Folders, files and packages that existed before the install are still
   there after it, unchanged.
4. Uninstall twice. The second run changes nothing and does not fail.
5. A dry run changes nothing.
6. Uninstall after a half-finished install.
7. The uninstall leaves a setting the person changed after the install as they
   set it.
8. Install over an older version, then uninstall. Nothing of either version is
   left. An upgrade alone undoes none of the person's settings.
9. Remove the app *without* the uninstaller, by deleting its files or removing
   the package. Then start a new shell or login and ask each manager for its
   status. Nothing causes an error, and nothing runs.

Compare settings as values, not as file text. Then a reset that leaves an
empty section header in a settings file does not count as a trace.

## On a real computer, at each release

A sandbox cannot imitate a real desktop, real services or a real package
manager. Once per release, or when the installer changes in a way the sandbox
cannot see, run the same cycle on a real computer:

1. Remove any current install, then list leftovers from older versions. Show
   the list to the person and let them decide what to remove by hand.
2. Take snapshot A.
3. Install, do whatever setup needs, such as logging out and in or
   restarting, and use the app.
4. Uninstall, take snapshot B, and compare A with B.
5. Reinstall if the person uses the app daily.

Never use `--purge` on someone's real data unless they ask for it. Expect
differences from other programs used in between, and ask which ones look like
the app's. If the tester is not the developer, give each command with the
folder to run it in. Say where the snapshots are kept, what would delete them,
and that they stay on the computer. Where the `human-feedback` skill is
available, it packages this as a test guide.

[`snapshot.py`](snapshot.py) does the recording and comparing:

```
python3 snapshot.py save A --folder /usr/local --folder ~/.config:1 \
    --folder ~/.config/myapp --folder ~/.local/state:1 \
    --folder ~/.local/state/myapp --file ~/.bashrc --command settings="dconf dump /"
python3 snapshot.py compare A B --keep ~/.local/state/myapp/history \
    --keep ~/.config/myapp
```

`--keep` names each folder that holds the person's kept data, such as
history, preferences and the backups of their settings. It does not name the
app's whole folder. Keeping all of `~/.local/state/myapp` would also hide a
ledger left in `myapp/install/`. The compare counts what is added inside a
kept folder, and the new folders that hold it, as kept. It reports what was
there before and is now gone as "kept data removed". Record each kept folder
in full, as above. A listing that stops at the kept folder cannot see what was
removed from it.

[`test-snapshot.sh`](test-snapshot.sh) holds every case a review has found
in `snapshot.py`. Run it after changing the script.

Save each snapshot to a new folder, outside the folders you record. Use the
test's own temporary folder, or a named one on a real computer. `save`
refuses a folder that already holds a snapshot, and does not create missing
parent folders. A compare ignores A and B themselves, but not another
snapshot saved in a recorded folder between them.

Copy `snapshot.py` into the project's `tools/` and wrap it in the project's
folders, files and commands, so each step is one short command.
