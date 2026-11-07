# Principles of a clean install and uninstall

Each rule says what to do and why. Examples come from different kinds of
projects; apply the idea, not the example. "The person" is whoever uses the
computer the software is installed on.

## 1. Know your footprint

List every change the install makes, including what the app does on first
run: files, folders, links, settings, startup entries, services, scheduled
jobs, shell profile lines, PATH or environment changes, packages it pulls in,
package sources, users or groups, browser or editor configuration, anything in
a shared config file. Keep the list in the project as a table, the
**footprint**: *what changes* and *what undoes it*. A change that is not on
the list will not be undone.

The footprint is the developer's description, kept in the repository. The
**ledger** (rule 4) is the installer's record, kept on the person's computer,
of what it actually changed there.

## 2. Four kinds of change, four owners

| Kind | Examples | On uninstall |
|---|---|---|
| **What the app owns** | the program, its libraries, icon, menu entry, service, its ledger | removed |
| **Changes to what the person already has** | a setting, a keyboard shortcut, a line in `~/.bashrc`, an entry in a shared config | put back as it was |
| **The person's data** | history, documents, preferences, accounts, and the backups of their original settings | **kept**, removed only on request (`--purge` or a "delete my data" choice) |
| **Caches** | anything the app can rebuild | removed |

Most messy uninstalls come from mixing these up: deleting the person's data
with the program, leaving a setting changed because "it was only a setting",
or a cache surviving because nobody thought of it as the app's.

Keep each kind in its own place, one folder per app: on Linux
`~/.config/<app>`, `~/.local/share/<app>`, `~/.local/state/<app>`,
`~/.cache/<app>`; on macOS `~/Library/Application Support/<app>` and
`~/Library/Caches/<app>`; on Windows `%APPDATA%\<app>` and
`%LOCALAPPDATA%\<app>`; in an editor or browser, the extension's own storage.
Then each kind is removed or kept as a whole.

These folders do not line up with the four kinds by themselves: an app's
config folder holds the person's preferences, which are their data, and
`~/.local/state` can hold both their history and the installer's own records.
Write in the footprint which kind each folder holds. Where one folder has to
hold two kinds, give each its own subfolder (the ledger in
`~/.local/state/<app>/install/`, the history beside it), so uninstall removes
or keeps whole folders and never picks files out of one. In particular the
ledger is the app's and goes, while the backups of the person's original
settings are their data and stay, so the two never share a folder.

## 3. Prefer changes that undo themselves

- **Let a package manager own the files it installs** when there is one (apt,
  rpm, Homebrew, MSI, pip, npm). It removes those files, and only those: not
  what the app or its scripts create later, and not first-run changes. On
  Debian and Ubuntu, `remove` keeps a package's config files in `/etc`;
  only `purge` deletes them. Put files where the platform expects packages to
  put them (a Debian package goes in `/usr`; `/usr/local` is for things
  installed by hand).
- **Add a file instead of editing a shared one.** Many systems read a folder of
  drop-in files (`conf.d/`, autostart folders, service unit folders). Removing
  your file is the whole undo. Some drop-in folders can break the system with
  one bad file (`sudoers.d`, for example); use the platform's checker before
  installing one.
- **When a shared text file must change, change one line,** marked as yours,
  that includes your own file, and that does nothing if your file is gone:
  `[ ! -f ~/.config/app/env.sh ] || . ~/.config/app/env.sh  # app` (fish,
  PowerShell and others need their own form). Removing that line is the undo.
- **Use the owner's tool for structured files.** When a file has an owner with
  a command or API (`git config`, `defaults write`, an editor's settings API,
  `gsettings`), change it through that, never by editing the text: hand edits
  lose comments and formatting, and the owner's tool can also reset a key.
  Change the narrowest scope that works (a project or workspace, not the whole
  user).
- **Ship a default instead of changing the person's value** when the platform
  allows it (a settings-override file in a package, an extension's
  contributed defaults). When the app goes, the default goes with it.
- **Install per person rather than system-wide** when nothing needs the
  system: no password, no other users affected, less to undo.

## 4. Change what the person already has with care

- **Ask first.** A change to someone's own settings needs their yes, at
  install or first run. Scripts that run with elevated rights (package
  install scripts, system installers) often run while nobody is logged in,
  and must not edit anyone's personal settings; do that from the app, as
  that person.
- **Back up the original** before the first change, somewhere the person can
  find it.
- **Record what you changed** in a small file, the **ledger**: each item, your
  value, and what was there before (unset, the person's value, an older
  version). Uninstall reads the ledger; it never guesses from what it finds.
- **Change entries, not whole values.** In a list, add or remove only your
  entry; everything else in it stays as the person has it.
- **Undo only what is still yours.** If the person changed it after you did,
  leave it and say so.
- **Put back what was there.** If the key was unset, reset it; do not write
  the default value, which looks the same but now counts as the person's
  choice, so later changes to the default never reach them. If it held the
  person's value, write that value back.

## 5. Remove only what you created

Record every item the install adds or replaces (file, folder, link, package,
setting, registration) and whether it existed before. Uninstall removes only
what you added, and puts back what you replaced. Folders: record parent
folders you had to create too, and remove them only once empty; never remove
a folder that existed before, even an empty one. A package or tool that was
already installed (perhaps at another version) stays.

**Registrations** (services, scheduled jobs, launch agents, login items,
registry entries, extensions registered with a host) live in the manager's
own records, not only in files. Undo them with the manager's command, in
reverse order: stop what runs, disable or unregister it, then remove the
files, then tell the manager to reload. Afterwards check the manager's state,
not only the files.

## 6. Know what triggers your undo, and design for the weakest

List how the software can leave the computer: your own uninstaller, a package
manager's removal hook, an app or extension host removing it, or someone
simply deleting it (a dragged-away app, a wiped folder). Some of these run
none of your code, and a package's removal hook cannot reach each person's
settings. So:

- Write nothing outside the app's own folders until the person opts in.
- Offer **Undo setup** inside the app (and as a command), and say in the docs
  to run it before removing the app.
- Make whatever stays behind **inert**: a startup entry or shell line that
  checks its target exists, a service removed with the package, a setting
  that falls back to normal when the app is gone. Nothing should error at
  login, slow a shell, or break a feature the person had before.
- Document the manual removal steps for the case where none of your code ran.

## 7. Uninstall survives any state

Uninstall must work after a half-finished install, after the person deleted
some files by hand, after an upgrade, and when run twice. Install must work
when run twice and over an older version. Every step checks before it acts
and skips what is already done. If uninstall removes its own files, run it
from a temporary copy.

## 8. Shared things are counted

When several people or projects on one computer share something (a system
component, a service, a shared folder), keep a record of who uses it. Each
uninstall removes only that person's part; the last one removes the shared
part.

## 9. Say what you do

- A **dry run** that lists every change without making any.
- Ask for any password **once, before changing anything**, so a wrong password
  or a cancel leaves the computer untouched.
- Output that says what was **done**, what was **kept** and **where**, and
  what the person still needs to do (log out, restart a program). Every step
  says something, even "nothing to do".
- A **status** or **doctor** command that shows what is installed and changed.
- Logs that record what the installer did, never the person's content.

## 10. Upgrades are part of the life cycle

- An upgrade replaces the old version's files completely; nothing of the old
  version stays behind.
- Switch to the new version in one step (stage it, then rename), so a failed
  upgrade leaves the old one working.
- Removal scripts often run during an upgrade too (Debian passes `upgrade`,
  rpm a count above zero). Undo the person's settings only on a real removal,
  never on an upgrade, and carry the ledger and backups over.
- Never take a fresh "original" backup over an existing one during an
  upgrade. A fresh install after a full uninstall backs up the settings as
  they are now, and keeps the older backup beside it.
- A newer uninstaller must clean up what older versions left, or a check must
  find those leftovers and list them.

## 11. Do no harm while installing

- Never restart something the person depends on (their desktop, network,
  input method, editor) unless there is no other way; ask them to log out or
  restart the program instead.
- Never ask for administrator rights for parts that do not need them.
- Check everything that can fail (missing dependencies, a conflicting setting
  someone else owns) before changing anything, and stop with "nothing was
  changed" when a check fails.

## 12. Prove it

A clean uninstall is a claim; test it. Record the computer's state, install,
**use the app** (caches and history appear only with use), uninstall, record
again, compare. Automatically in a sandbox for every change, and on a real
computer at each release. See [`testing.md`](testing.md).
