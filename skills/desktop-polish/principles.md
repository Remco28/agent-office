# Principles

Each rule says what to do, why, and how to check it. Findings refer to rules **by name**, not by number, so nobody confuses a finding with a rule.

Some findings break a rule. Ten text sizes is simply wrong. Others are taste, such as snappy or animated, which word to use, or how icons look. Fix the first kind. Ask the human about the second, and record the answer in the project's `docs/DESIGN.md`.

## Universal

These hold for any interface, whether desktop, web or mobile.

### One set of values

Use a short, named list of each design value, and nothing outside it:

- 3 to 5 text sizes
- spacing on a 4 px grid
- 2 to 3 corner roundings
- 2 to 3 icon sizes
- 2 to 3 durations
- colours named by role, such as ink, muted text, border, surface, accent and danger, not by shade

**Why.** Each one-off value is invisible on its own. Together they make an interface feel slightly off, and nobody can say why. This rule does more for polish than any other.

**Check.** Run `measure.py`. A value typed in place, such as a hex code or a bare `12.5`, where a named value exists is a finding. So is a near-twin, such as two borders one shade apart or two reds. So are definitions spread over several files.

### One icon family

All icons come from one family, at one line weight and in one style, either all outline or all filled. Draw custom icons on the same grid and with the same stroke as the family.

**Why.** A bold filled icon beside thin outline ones is the quickest sign of an unfinished app.

**Check.** Compare zoomed screenshots of every toolbar and menu side by side.

### One look per kind of control

Every text field looks like a text field. A dropdown looks like a field with an arrow, never like bare text. Buttons come in one or two styles, used consistently, one for primary actions and one for secondary ones. Units and suffixes such as °, px and % sit tight against their number, inside the same box.

**Check.** List the controls in each panel and group them by kind. Any kind that comes in two looks is a finding.

### The same states everywhere

Every interactive thing has hover, pressed, focused and disabled states, drawn the same way across the app, and a cursor that matches what it does. Focused here means focused from the keyboard.

**Check.** Hover over, Tab to and click every control. Look at each one disabled.

### One word per thing

Pick one name for each concept, for example image or picture, and delete or remove. Use it in every label, tooltip, message, menu and document. Headings never repeat. A panel titled "Arrow" does not open with a section that is also titled "Arrow".

**Check.** Search the interface text for synonyms. Read each panel from the top down.

### One highlight at a time

At any moment, one thing reads as current or selected. Show related context, such as the selected thing's group or parent, more quietly, with a lighter tint, bold text or a marker. Never give it the same highlight.

**Check.** Select something and count the places that look selected.

### Nothing overlaps, nothing is cut off

No element covers another by accident. Labels, badges and pop-overs stay inside their own region. Scrolling areas end on a whole row, or fade, instead of slicing a row in half. Text that can be long gets an ellipsis, never an overflow.

**Check.** Take screenshots at the smallest supported window and at a large one, with long names and many items.

### A distinction that matters must be plainly visible

If a grouping, state or difference matters to the user, make it obvious with a real divider or a clear colour change. Users will not see a few pixels of extra gap or a faint tint.

**Check.** Ask someone who has not seen the change to point at it, without telling them where it is.

### Controls do not appear only under certain conditions

Users will not find a control that exists only once some condition is met, such as a reset link that appears after a change. Show it all the time, disabled until it applies. Then users know it is there before they need it, and the layout does not shift.

### What leaves the app matches the screen

Exports, copies, prints and saved files show exactly what the screen shows. That includes whatever is drawn over something else or hides it. A part copied on its own takes along anything that changes how it looks, such as an overlay, a mask or a redaction.

**Check.** For each way out of the app, compare the result with the screen, pixel for pixel where it matters.

### Never say "done" without checking

Before telling the user something worked, such as copied, saved, sent or exported, confirm that it happened, for example by reading the clipboard or file back. If it did not, say so plainly, and say what is still there instead.

**Why.** A false "Copied" leaves the previous contents in place, and the user pastes the wrong thing. That can be the very thing they meant to hide.

### Same rendering on every machine

Bundle the interface font instead of relying on whatever the system has, so spacing and weight are the same everywhere. Test at 100% and at high-resolution scaling, and keep one-pixel lines sharp.

### Motion is a decision

Either things appear instantly everywhere, or they use short fades of about 100 to 150 ms everywhere. A mix looks accidental. Many people prefer an instant, snappy feel, so ask, and record the answer.

## Desktop

These rules apply to apps that run in their own window.

### Keyboard first

- Every frequent action has a shortcut, and the app shows the shortcut where the action is, in the menu item or tooltip.
- Shortcuts follow the platform, with Ctrl on Linux and Windows and Cmd on macOS. Use the standard keys for standard actions, such as Ctrl+Z, Ctrl+S and F11.
- Single-letter shortcuts never fire while the user is typing in a field.
- Esc always means one predictable thing. It backs out of the current mode, then clears the selection. Don't give it a second job.
- Tab moves through panels in a sensible order, and focus is always visible.

### Menus

- Group items by purpose, with dividers between the groups.
- Show shortcuts right-aligned.
- End items that open a dialog with "…".
- Disable items that can't be used right now. Do not hide them.
- A menu item's label says what it will do in the current state, for example Full screen or Leave full screen.

### The window

- The title shows the document name, and a mark for unsaved changes.
- The window has a minimum size below which the layout no longer works, and you test the layout at that size.
- The window remembers its size and position.
- Full screen, maximise and multiple monitors behave as they do in the platform's own apps.
- Closing with unsaved work asks first, and unsaved work survives a crash.

### Feedback the user can trust

- Show short messages for completed actions, and clear, specific messages for failures.
- Offer undo for anything destructive.
- Long work shows progress and can be cancelled.
- Nothing claims success it has not confirmed. See "Never say done without checking".

### Platform conventions

Use native file dialogs and the platform's clipboard formats. Make scrolling and zooming feel like other apps on that system. Provide an app icon at every size the system uses. Where platforms differ, as Windows, Linux and macOS do, follow that platform instead of copying another one.
