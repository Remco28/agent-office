# Principles

Each rule says what to do, why, and how to check it. Rules are referred to **by name**, not by number, so a finding and a rule are never confused.

Some findings break a rule (ten text sizes is simply wrong). Others are taste (snappy or animated, which word to use, how icons look). Fix the first kind. Ask the human about the second, and record the answer in the project's `docs/DESIGN.md`.

## Universal

These hold for any interface: desktop, web or mobile.

### One set of values

Use a short, named list of each design value, and nothing outside it:

- 3–5 text sizes
- spacing on a 4 px grid
- 2–3 corner roundings
- 2–3 icon sizes
- 2–3 durations
- colours named by role (ink, muted text, border, surface, accent, danger), not by shade

**Why:** each one-off value is invisible on its own, but together they make an interface feel slightly off without anyone being able to say why. This rule does more for polish than any other.

**Check:** `measure.py`. A value typed in place (a hex code, a bare `12.5`) where a named value exists is a finding. So is a near-twin (two borders one shade apart, two reds), and so are definitions spread over several files.

### One icon family

All icons come from one family, at one line weight and one style: all outline or all filled. Custom icons are drawn on the same grid and with the same stroke as the family.

**Why:** a bold filled icon beside thin outline ones is the quickest tell of an unfinished app.

**Check:** a zoomed screenshot of every toolbar and menu, side by side.

### One look per kind of control

Every text field looks like a text field. A dropdown looks like a field with an arrow, never like bare text. Buttons come in one or two styles, used consistently: one for primary actions, one for secondary ones. Units and suffixes (°, px, %) sit tight against their number, inside the same box.

**Check:** list the controls in each panel and group them by kind. Any kind that comes in two looks is a finding.

### The same states everywhere

Every interactive thing has hover, pressed, focused (from the keyboard) and disabled states, drawn the same way across the app, and a cursor that matches what it does.

**Check:** hover over, Tab to and click every control. Look at each one disabled.

### One word per thing

Pick one name for each concept (image or picture, delete or remove) and use it in every label, tooltip, message, menu and document. Headings never repeat: a panel titled "Arrow" does not open with a section that is also titled "Arrow".

**Check:** search the interface text for synonyms. Read each panel from the top down.

### One highlight at a time

At any moment, one thing reads as current or selected. Related context (the selected thing's group or parent) is shown more quietly: a lighter tint, bold text or a marker, never the same highlight.

**Check:** select something and count the places that look selected.

### Nothing overlaps, nothing is cut off

No element covers another by accident. Labels, badges and pop-overs stay inside their own region. Scrolling areas end on a whole row, or fade, rather than slicing a row in half. Text that can be long gets an ellipsis, never an overflow.

**Check:** screenshots at the smallest supported window and at a large one, with long names and many items.

### A distinction that matters must be plainly visible

If a grouping, state or difference matters to the user, make it obvious: a real divider, a clear colour change. A few pixels of extra gap, or a faint tint, will not be seen.

**Check:** ask someone who has not seen the change to point at it, without telling them where it is.

### Controls do not appear only under certain conditions

A control that exists only once some condition is met (a reset link that appears after a change) will not be found. Show it all the time, disabled until it applies, so it is known before it is needed and the layout does not shift.

### What leaves the app matches the screen

Exports, copies, prints and saved files show exactly what the screen shows. That includes whatever is drawn over or hides something else. A part copied on its own takes along anything that changes how it looks (an overlay, a mask, a redaction).

**Check:** for each way out of the app, compare the result with the screen, pixel for pixel where it matters.

### Never say "done" without checking

Before telling the user something worked (copied, saved, sent, exported), confirm it actually happened, for example by reading the clipboard or file back. If it did not, say so plainly, and say what is still there instead.

**Why:** a false "Copied" leaves the previous contents in place, and the user pastes the wrong thing. That can be the very thing they meant to hide.

### Same rendering on every machine

Bundle the interface font rather than relying on whatever the system has, so spacing and weight are the same everywhere. Test at 100% and at high-resolution scaling, and keep one-pixel lines sharp.

### Motion is a decision

Either things appear instantly everywhere, or they use short fades (about 100–150 ms) everywhere. A mix looks accidental. Many people prefer an instant, snappy feel, so ask, and record the answer.

## Desktop

These are specific to apps that run in their own window.

### Keyboard first

- Every frequent action has a shortcut, and the shortcut is shown where the action is (menu item, tooltip).
- Shortcuts follow the platform: Ctrl on Linux and Windows, Cmd on macOS. Use the standard keys for standard actions: Ctrl+Z, Ctrl+S, F11 and the like.
- Single-letter shortcuts never fire while the user is typing in a field.
- Esc always means one predictable thing (back out of the current mode, then clear the selection). Don't give it a second job.
- Tab moves through panels in a sensible order, and focus is always visible.

### Menus

- Grouped by purpose, with dividers between the groups.
- Shortcuts are shown right-aligned.
- Items that open a dialog end in "…".
- Items that can't be used right now are disabled, not hidden.
- A menu item's label says what it will do in the current state (Full screen / Leave full screen).

### The window

- The title shows the document name, and a mark for unsaved changes.
- There is a minimum size below which the layout no longer works, and the layout is tested at that size.
- The window's size and position are remembered.
- Full screen, maximise and multiple monitors behave as they do in the platform's own apps.
- Closing with unsaved work asks first, and unsaved work survives a crash.

### Feedback the user can trust

- Short messages for completed actions, clear and specific messages for failures.
- Undo for anything destructive.
- Long work shows progress and can be cancelled.
- Nothing claims success it has not confirmed (see "Never say done without checking").

### Platform conventions

Native file dialogs. The platform's clipboard formats. A scroll and zoom feel that matches other apps on that system. An app icon at every size the system uses. Where a platform differs (Windows, Linux, macOS), follow that platform rather than copying another one.
