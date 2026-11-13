# Why the rules are the way they are

**This file is for maintaining the skill, not for running it.** `SKILL.md` is the procedure. This
file records what each rule is built on, so nobody simplifies a rule away without knowing what it
protects against.

## The evidence base, stated honestly

Everything here comes from **one brand, one human and one long session**. That was Team Remco on
2026-10-28, and the result is the `teamremco-style` repository. The human had never made a brand
before. The work took about a dozen review rounds and produced:
- 20 logo SVGs, with PNG exports;
- desktop and web icons;
- tokens, components and a guide page;
- 14 generated photos.

So treat the **order of phases and the general rules** as tested once. Treat specific numbers, such
as two to nine options or "retry nearly half", as hypotheses until another brand confirms them.

Phase 2, the generated mock style sheet, is the one part that **wasn't done inside the workflow**.
The human made the sheet with another agent first, and brought it in. It worked very well as a
starting point. Generating it inside the skill is the obvious next step, but nobody has tried it yet.

## Episodes behind the rules

**Show, don't describe.** When the human was unsure what "cut-paper shadows" or "block photos"
meant, one side-by-side render settled it in a single reply. Every later round used renders, and
none needed a second explanation.

**One variable per round.** The wordmark took four rounds: font, case, size and position. When a
round mixed font and size, the human said they liked parts of several options. When each round
changed one thing, they answered in one word, "C".

**Letter case matters more than the font.** In round 1 every candidate was in capitals, and none
won. The human then brought a lowercase mock-up and loved it. Setting all nine fonts in both cases
showed why: lowercase turned "a sign" into "a name". They said they hadn't accounted for it. The skill
now asks for both cases from the first sweep.

**Small things decide.** The winning font, Baloo 2, won on one letter. Its lowercase *t* "politely
tucks" its crossbar away from the mark. Ask what tips a choice, and record it. That sentence is what
stops a later agent from swapping the font for a "cleaner" one.

**Accept the gut, keep the parameter.** In the vertical-position round, the agent recommended the
mathematically centered option, B. The human chose C because "B looks floaty", and said they might
regret it. The position is one number in the build, `TEXT_DROP`, so changing it later costs nothing.

**Check contrast early, with numbers.** The mock-up used colored chips with dark text. On solid blue,
neither dark text at 3.99:1 nor white at 3.68:1 passes 4.5:1. Catching this in phase 3 turned "the
mock-up is wrong" into a design choice: tints for chips, and solid colors as fills only. It was also
calmer, which the human wanted anyway.

**Gamut-map, don't clip.** The first light blue tint, made in OKLCH and clipped to sRGB, came out
cyan, #D2EDFF instead of #E0ECFF. Reducing chroma until the color fits fixed it.

**Check the small sizes.** At 16px, the mark's 6-unit row gap is under half a pixel, and the circle
merged into the square. A small-size variant with wider gaps fixed it, and nobody notices it unless
they look for it.

**Hand-draw terminal art.** Rasterizing the vector mark to about 12 terminal pixels smeared it into
blobs, with a "neck" from circle to square. Pixel art drawn on a strict grid looked right at the
first attempt. The first drawing did forget a gap column, so check the plain-text output.

**Never invent facts about people.** The name turned out to come from the human's two children. The
agent asked rather than guessed. The human then chose to keep the children's names out of everything,
and that became a hard rule in `AGENTS.md`, `VOICE.md` and the office. Before every commit, the agent
checked the repository for the names with `git grep`.

**The voice brief changed the positioning.** The confirmation rounds brought out things that weren't
in the original brief: "not an AI or vibe-coding showcase", "specific itches, not tools for
everyone", "don't say household (too garagy)". Each one changed the copy. The voice phase belongs
before the final copy pass, not after.

**Photos: plan by use, compose for the crop.** The generator makes only three sizes. The agent planned
each shot around its final crop, 3:1 for the banner, 1.91:1 for the preview and 4:5 for the phone, so
no shot had to be redone for framing.

Six of the 14 needed a retry:
- the triangle came out as a ramp;
- the table drifted to orange pine;
- coral drifted to brick red;
- the blocks came out too big;
- two shots didn't tell their story, because "toppled" wasn't toppled and "work in progress" was just a row.

Each fix was one added phrase, and the prompt patterns now include those kinds of phrase: a "not X"
for drift, the exact orientation, the size as a share of the width, and what must visibly be
happening. Passing an earlier photo as a reference image made four single-object shots match.

**Determinism catches what review doesn't.** Building twice showed that fontTools wrote a new
timestamp into every web font, so each rebuild looked like a change to git. `recalcTimestamp=False`
fixes it. Without the checksum comparison, nobody would have noticed until a confusing diff.

**Hand-off is a phase of its own.** By the end, the repository worked but was hard for a stranger to
use:
- explorations sat beside the real logos;
- three build scripts had to run in order;
- exploration scripts depended on fonts in a scratch folder;
- app icons were named `16.png`.

A dedicated clean-up pass fixed all of it, and is now phase 10.

## Decided in review, 2026-10-28

A review-loop with four fresh readers, before the skill was installed, changed these. Frank made each
call:

- **A new repository means a new agent.** The draft had the agent create the kit's repository and
  carry on in it. That breaks the office's rule of one agent per repository, and files the office notes
  under whichever project each command ran from. Phase 0 now runs only `office init <folder>`, hands
  the human a paragraph to paste, and stops. A new agent carries on there.
- **The voice covers public copy only.** Developers and agents read the kit's own docs, and a later
  agent finding `docs/VOICE.md` would otherwise write the README in the brand's voice. The guide
  page's prose waits for phase 8, so voice-brief's "nothing gets written before the brief" holds.
- **Push only if the human agrees.** This matches the office's rule that pushing is the human's call.
- **Say where you are each round,** because a first-time human can't see how far the process goes.
- **A fallback when nothing can generate images.** Nobody has tested it.
- **Print stays out** until a brand needs it, although two readers, a bakery and a choir, wanted it.

## Where the skill is thin

- **Phase 2.** Nobody has tested it inside the workflow, as described above.
- **One taste.** Every rule comes from a calm, playful, geometric brand. A loud or typographic brand
  may need different rounds, for example no mark at all, or a custom typeface.
- **No print run.** The checklist has no print deliverables such as business cards, signage or
  merchandise. Add them when a brand needs print, and check them against a real printer.
- **Refining an existing design.** It is in scope, but untried. The one brand so far started from nothing.
- **One image generator.** Only Codex's built-in image tool was used. Other generators may honor
  sizes or references differently.
