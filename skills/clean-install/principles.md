# Principles of a clean install and uninstall

Each rule says what to do and why. The examples come from different kinds of
projects. Apply the idea, not the example. "The person" is whoever uses the
computer the software is installed on.

## 1. Know your footprint

List every change the install makes, including what the app does on first
run. That covers files, folders, links, settings, startup entries, services,
scheduled jobs, shell profile lines, PATH or environment changes, packages it
pulls in, package sources, users or groups, browser or editor configuration,
and anything in a shared config file. Keep the list in the project as a table
called the **footprint**, with *what changes* and *what undoes it*. Nobody
will undo a change that is not on the list.

The footprint is the developer's description, kept in the repository. The
**ledger**, described in rule 4, is the installer's record of what it actually
changed on the person's computer, and it is kept on that computer.

## 2. Four kinds of change, four owners

| Kind | Examples | On uninstall |
|---|---|---|
| **What the app owns** | the program, its libraries, icon, menu entry, service and ledger | removed |
| **Changes to what the person already has** | a setting, a keyboard shortcut, a line in `~/.bashrc`, an entry in a shared config | put back as it was |
| **The person's data** | history, documents, preferences, accounts, and the backups of their original settings | **kept**, and removed only on request, with `--purge` or a "delete my data" choice |
| **Caches** | anything the app can rebuild | removed |

Most messy uninstalls come from mixing these up. The uninstaller deletes the
person's data along with the program, or leaves a setting changed because "it
was only a setting", or leaves a cache because nobody thought of it as the
app's.

Keep each kind in its own place, one folder per app. On Linux that is
`~/.config/<app>`, `~/.local/share/<app>`, `~/.local/state/<app>` and
`~/.cache/<app>`. On macOS it is `~/Library/Application Support/<app>` and
`~/Library/Caches/<app>`. On Windows it is `%APPDATA%\<app>` and
`%LOCALAPPDATA%\<app>`. In an editor or browser it is the extension's own
storage. Then uninstall removes or keeps each kind as a whole.

These folders do not match the four kinds by themselves. An app's config
folder holds the person's preferences, which are their data, and
`~/.local/state` can hold both their history and the installer's own records.
Write in the footprint which kind each folder holds. Where one folder has to
hold two kinds, give each kind its own subfolder. For example, put the ledger
in `~/.local/state/<app>/install/` and the history beside it. Then uninstall
removes or keeps whole folders and never picks files out of one. In
particular, the ledger belongs to the app and goes, while the backups of the
person's original settings are their data and stay. So the two never share a
folder.

## 3. Prefer changes that undo themselves

- **Let a package manager own the files it installs** when there is one, such
  as apt, rpm, Homebrew, MSI, pip or npm. It removes the package's own files,
  and only those. It does not remove what the app creates later or first-run
  changes. Depending on the manager, it may also leave the dependencies it
  pulled in. apt leaves them until `apt autoremove`. pip never removes them,
  so install a pip tool in its own environment, such as pipx or a venv, and
  the dependencies go with it. The package's own install and removal scripts
  are your code, so what they change goes in the footprint like any other
  change. On Debian and Ubuntu, `remove` keeps a package's config files in
  `/etc`, and only `purge` deletes them. Put files where the platform expects
  packages to put them. A Debian package goes in `/usr`, and `/usr/local` is
  for things installed by hand.
- **Add a file instead of editing a shared one.** Many systems read a folder of
  drop-in files, such as `conf.d/`, autostart folders and service unit
  folders. Removing your file is the whole undo. Some drop-in folders, such as
  `sudoers.d`, can break the system with one bad file. Use the platform's
  checker before installing a file into one.
- **When a shared text file must change, change one line.** Mark the line as
  yours, have it include your own file, and make it do nothing if your file is
  gone, for example
  `[ ! -f ~/.config/app/env.sh ] || . ~/.config/app/env.sh  # app`. fish,
  PowerShell and other shells need their own form. Removing that line is the
  undo.
- **Use the owner's tool for structured files.** When a file has an owner with
  a command or API, such as `git config`, `defaults write`, an editor's
  settings API or `gsettings`, change the file through that, never by editing
  the text. Hand edits lose comments and formatting, and the owner's tool can
  also reset a key. Change the narrowest scope that works, such as a project
  or workspace instead of the whole user.
- **Ship a default instead of changing the person's value** when the platform
  allows it, for example with a settings-override file in a package or an
  extension's contributed defaults. When the app goes, the default goes with
  it.
- **Install per person instead of system-wide** when nothing needs the
  system. Then the install needs no password, affects no other users and
  leaves less to undo.

## 4. Change what the person already has with care

- **Ask first.** A change to someone's own settings needs their yes, at
  install or first run. Scripts that run with elevated rights, such as package
  install scripts and system installers, often run while nobody is logged in.
  They must not edit anyone's personal settings. Make those changes from the
  app, as that person.
- **Back up the original** before the first change, somewhere the person can
  find it.
- **Record what you changed** in a small file, the **ledger**. For each item,
  record your value and what was there before, whether that was unset, the
  person's value or an older version. Uninstall reads the ledger, and never
  guesses from what it finds.
- **Change entries, not whole values.** In a list, add or remove only your
  entry. Everything else in it stays as the person has it.
- **Undo only what is still yours.** If the person changed it after you did,
  leave it and say so.
- **Put back what was there.** If the key was unset, reset it. Do not write
  the default value. It looks the same, but it now counts as the person's
  choice, so later changes to the default never reach them. If the key held
  the person's value, write that value back.

## 5. Remove only what you created

Record every item the install adds or replaces, whether a file, folder, link,
package, setting or registration, and whether it existed before. Uninstall
removes only what you added, and puts back what you replaced. For folders,
also record the parent folders you had to create, and remove them only once
they are empty. Never remove a folder that existed before, even an empty one.
A package or tool that was already installed stays, even at another version.

**Registrations** live in the manager's own records, not only in files. They
include services, scheduled jobs, launch agents, login items, registry entries
and extensions registered with a host. Undo them with the manager's command,
in reverse order. Stop what runs, disable or unregister it, remove the files,
and then tell the manager to reload. Afterwards, check the manager's state,
not only the files.

## 6. Know what triggers your undo, and design for the weakest

List how the software can leave the computer. It can go through your own
uninstaller, a package manager's removal hook, or an app or extension host
removing it. Someone can also simply delete it, by dragging an app away or
wiping a folder. Some of these run none of your code, and a package's removal
hook cannot reach each person's settings. So:

- Write nothing outside the app's own folders until the person opts in.
- Offer **Undo setup** inside the app and as a command, and tell people in the
  docs to run it before removing the app.
- Make whatever stays behind **inert**. A startup entry or shell line checks
  that its target exists, a service goes with the package, and a setting falls
  back to normal when the app is gone. Nothing should cause an error at login,
  slow a shell or break a feature the person had before.
- Document the manual removal steps for the case where none of your code ran.

## 7. Uninstall survives any state

Uninstall must work after a half-finished install, after the person deleted
some files by hand, after an upgrade, and when run twice. Install must work
when run twice and over an older version. Every step checks before it acts
and skips what is already done. If uninstall removes its own files, run it
from a temporary copy.

## 8. Shared things are counted

Sometimes several people or projects on one computer share something, such as
a system component, a service or a shared folder. Keep a record of who uses
it. Each uninstall removes only that person's part, and the last one removes
the shared part.

## 9. Say what you do

- Offer a **dry run** that lists every change without making any.
- Ask for any password **once, before changing anything**, so a wrong password
  or a cancel leaves the computer untouched.
- Make the output say what was **done**, what was **kept** and **where**, and
  what the person still needs to do, such as log out or restart a program.
  Every step says something, even "nothing to do".
- Offer a **status** or **doctor** command that shows what is installed and
  changed.
- Keep logs that record what the installer did, never the person's content.

## 10. Upgrades are part of the life cycle

- An upgrade replaces the old version's files completely. Nothing of the old
  version stays behind.
- Switch to the new version in one step by staging it and then renaming it, so
  a failed upgrade leaves the old version working.
- Removal scripts often run during an upgrade too. Debian passes `upgrade`,
  and rpm passes a count above zero. Undo the person's settings only on a real
  removal, never on an upgrade, and carry the ledger and backups over.
- Never take a fresh "original" backup over an existing one during an
  upgrade. A fresh install after a full uninstall backs up the settings as
  they are now, and keeps the older backup beside it.
- A newer uninstaller must clean up what older versions left, or a check must
  find those leftovers and list them.

## 11. Do no harm while installing

- Never restart something the person depends on, such as their desktop,
  network, input method or editor, unless there is no other way. Ask them to
  log out or restart the program instead.
- Never ask for administrator rights for parts that do not need them.
- Before changing anything, check everything that can fail, such as missing
  dependencies or a conflicting setting someone else owns. Stop with "nothing
  was changed" when a check fails.

## 12. Prove it

A clean uninstall is a claim, so test it. Record the computer's state,
install, **use the app**, uninstall, record again and compare. Using the app
matters, because caches and history appear only with use. Run this
automatically in a sandbox for every change, and on a real computer at each
release. See [`testing.md`](testing.md).
