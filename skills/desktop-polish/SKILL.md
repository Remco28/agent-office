---
name: desktop-polish
description: Make a desktop app look and feel polished and consistent. Use automatically when building or changing any desktop app's interface, and when asked to polish it, review its design, or make it look professional, finished or less amateurish. Covers design values (text sizes, colours, spacing, corners), icons, controls, wording, states, keyboard and window behaviour, and copies/exports that must match the screen.
---

# Desktop polish

A desktop app feels finished when it behaves like one carefully made thing, with no single detail standing out. That comes from a few habits held strictly, not from extra features: a short list of design values used everywhere, one look per kind of control, the same states everywhere, one word per thing, and nothing overlapping or cut off. This skill is those habits, plus a way to measure them.

The rules are in [`principles.md`](principles.md). The review routine is in [`review.md`](review.md). [`measure.py`](measure.py) counts the values a codebase really uses. [`starter-values.md`](starter-values.md) is a starting set for an app that has none yet.

## The skill holds the method; the project holds the values

Never copy another app's colours or sizes. Each project keeps its own design values in **one code file** (for example `lib/ui/design.dart`, or `:root` variables in one CSS file). It also keeps its **decisions** in a short `docs/DESIGN.md`: the choices its human made that are taste rather than rule (animated or snappy, which word for a thing, which icon style). Read both before changing the interface, and add to them as decisions are made. If they do not exist yet, create them the first time you work on the interface, starting from `starter-values.md` or from the values the app already uses most.

## While building (always)

Whenever you add or change interface in a desktop app:

1. Use only the project's named values. If a value you need is missing, add it to the design file under a name, rather than typing a number or colour in place.
2. Make new controls match the existing ones of the same kind: same height, border, states, label style.
3. Use the project's words for things (`docs/DESIGN.md`), and the same word everywhere.
4. Give every interactive thing hover, pressed, focused and disabled states, and a cursor that says what it does.
5. Check the change in the running app, not only in tests: at the normal size and at the smallest supported window. Look for overlap, clipping and anything that pops out from its surroundings.
6. Anything that leaves the app (export, copy, print, save) must match what is on screen, and must be confirmed to have happened before the app says it did.

Keep this light. A small change needs these checks, not a full review.

## When asked to polish or review

Follow [`review.md`](review.md):

1. Measure the codebase.
2. Look at the running app.
3. Walk through its states.
4. Report the findings worst first, each tied to the rule it breaks.

Fix what clearly breaks a rule. **Ask the human about taste**, then record the answer in `docs/DESIGN.md` so nobody asks again. Keep the findings as a checklist in `docs/POLISH_TODO.md` on a branch of its own, so the polish can be merged as one piece, and delete the file once the list is done.

If the human should judge the result, a before-and-after round through the `human-feedback` skill works well.

## Improving this skill

When a review finds a kind of problem these rules do not cover, add the general rule to `principles.md` in agent-office: never the project's specifics, only the lesson. Every app after that benefits.
