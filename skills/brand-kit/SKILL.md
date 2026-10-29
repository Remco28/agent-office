---
name: brand-kit
description: Create a complete brand identity with the human, usually from scratch but also by refining an existing design, and ship it as a documented, rebuildable brand-kit repository. Covers discovery, a generated mock style sheet, palette, shapes and mark, wordmark, type, logo files, icons, design tokens, components, voice, photography and handoff. Use when the human wants a new brand, logo or style guide for an organization, product or site. Long and interactive (many rounds with the human); not for small logo tweaks or for applying an existing brand to a project. For an app's interface values without a new identity, use desktop-polish; for a writing voice alone, use voice-brief.
---

# Brand kit

A brand is a series of **small decisions the human makes by looking**, then a build that turns
those decisions into files any project can use. This skill is the order of those decisions, how to
present each one, and what the finished kit must contain.

The human decides taste; the agent proposes, renders, checks and records. Most humans have never
made a brand before. Lead the process and **ask one small set of questions at a time**. Recommend
an answer each time, but never decide taste for them without saying so.

Most brands this is used for are new. It can also **refine an existing design**: the phases are the
same, and phase 2 says what changes.

Take only the phases a project needs. A single-site brand may skip desktop icons, and a brand
without photos skips phase 9. Keep the order, though: later phases depend on earlier answers.

Supporting files:
- [`prompts.md`](prompts.md): discovery questions, the mock style sheet prompt, and the photo prompts.
- [`checklist.md`](checklist.md): every deliverable, and the definition of done.
- [`evidence.md`](evidence.md): why the rules are what they are. For maintaining the skill, not for running it.

A finished example of everything here is the `teamremco-style` repository: its `BRAND.md`,
`docs/USING.md` and `scripts/` show one way to do each phase. Read it if you can find it, but don't
copy its colors, fonts or shapes: those were one human's taste.

## Rules for every phase

1. **Show, don't describe.** Every decision gets a side-by-side render, in light and dark if the
   brand has both. Nobody can choose between font names or hex codes in a sentence.
2. **One variable per round.** Settle the layout, then the font, then the size, then the position.
   Comparing everything at once produces "I like parts of all of them".
3. **Two to nine options per round.** One gives no real choice; more than nine turns into a wall.
   Whole style sheets are costly, so two or three; detail rounds usually have more. Label them
   (A, B, C) so the human can answer in one word.
4. **Recommend, then accept the gut.** Say which option you'd pick and why. If the human picks
   another, take it. "B looks floaty" is a real reason, and good brands are made from those.
   Keep the losing option's settings as one parameter, in case they change their mind.
5. **Write each decision down as it's made, with its reason,** in the project's docs (`BRAND.md`, or
   a decisions list until it exists), and commit after every round. The reason is what stops the
   next agent from reopening the question. In the office, remember only what the next agent would
   otherwise rediscover: where the decisions live, hard rules such as privacy, and build facts.
6. **Keep explorations apart from final assets.** Round outputs go in an `explorations` or
   `archive` folder from the start, never next to the real logo files.
7. **Never invent facts about people.** Ask where the name comes from, who is behind the brand,
   and what must stay private. Record privacy rules as hard rules (for example "never publish the
   children's names").
8. **Check by machine what a machine can check:** contrast, file sizes, broken links, stray words.
   Leave taste to the human.
9. **Say where you are.** Open each round by naming the phase, this round's one question, and what
   comes after it. A human who has never made a brand can't see the map.

## Phase 0 · Set up

- **Repository:** the kit gets its own repository, and one agent works in one repository. If you are
  not already in the kit's repository, agree a name and folder with the human (beside their other
  projects, not inside one: init refuses that) and run `office init <folder>`, which creates the git
  repository; do nothing else there. Write the human a short paragraph to paste into a new agent
  started in that folder: use the brand-kit skill from phase 0, what they asked for, where any
  existing design files are, and anything already decided. Then stop. The new agent begins this
  phase again, inside the kit's repository, with a first commit and an office work item.
- **Tools:** check what this machine has. Install only what's missing, at user level, and record each
  tool in the office. The usual needs are:
  - a Python environment for the project (`uv`), with fontTools, uharfbuzz and Pillow;
  - an SVG-to-PNG renderer (`resvg`);
  - a headless browser for screenshots.
- **Image generation:** find out whether any of the human's subscriptions can generate images (look
  at the office's tool list first). **Make one test image, in your scratch folder, before planning
  around it.** If nothing can generate images, say so plainly: phase 2's sheets become SVG or HTML
  boards you build, and phase 9's plan becomes a shot list for a photographer or a phone.

## Phase 1 · Discovery

Goal: a short **brand brief** the human confirms, saved as `docs/BRIEF.md`.

Ask in small batches; the question bank is in `prompts.md`. Cover:

- **Scope:** one site, one product, or the whole organization? Light only, or dark too? Which
  platforms (web, desktop, mobile, command line, print)? If they need print, say that this skill
  doesn't cover print files yet, and write in the brief what they'll need.
- **Who and why:** who is behind it, where the name comes from, and what must stay private.
- **Feeling:** five to ten words for how it should feel, the inspirations (objects, places, other
  brands), and an **avoid list**. The avoid list often says more than the wish list.
- **Positioning:** what it is, what it deliberately isn't, and who it's for.

If the human pastes a description from elsewhere, treat it as input to the brief, not as the brief
itself. Turn vague words into **is / is-not pairs** ("playful, not childish").

## Phase 2 · Mock style sheet

Goal: the human reacts to **whole looks** before any detail is designed.

Generate two or three complete style sheets, each a single image, from the brief, using the
template in `prompts.md`. A sheet shows the logo variants, palette, shapes, patterns, type, a few
interface elements and icons, and a few real-world uses. Vary the sheets in the dimension that's
least settled (for example calm vs lively, or geometric vs hand-made).

These sheets are **for reacting to, not a specification**. Ask what they like, what's off, and which
sheet is closest. Expect image models to get text and exact colors wrong; that doesn't matter here.

If the human arrives with a mock-up of a new look, made elsewhere, skip the generation and use theirs
as the chosen sheet. A design already in use, to be refined, is different; see below.

**Refining an existing design.** Ask for the original files (vector if they exist, otherwise the best
image there is). Show the design back as it is, large and at 16px, in light and dark, and ask what
must stay recognizable and what bothers them. Then make the two or three sheets differ in how far
they move from the original (for example: the same mark tidied, the mark redrawn, a new mark that
keeps only the colors), passing the original as a reference image (with no generator, build them
as boards from the original). The extraction plan (phase 3) then says what stays and what changes,
and in phases 4 and 5 a part that stays starts from the original's files, not from nothing.

## Phase 3 · Extraction plan

Goal: the human approves a plan before anything is built.

From the chosen sheet, list:

- **What to keep:** the elements to turn into real files.
- **What can't be reproduced honestly**, with an alternative for each. Painterly textures and
  photos don't survive as vectors.
- **What breaks a rule:** for example text on a bright color that fails contrast. Check this early,
  with numbers.
- **The deliverables**, from `checklist.md`, and the folder layout.

Show the plan as a short list and ask: go, or change?

## Phase 4 · Foundations

Visual rounds, one decision each:

1. **Mood and texture.** Where the warmth comes from (flat, a subtle texture, cut-paper shadows,
   photography). In dark mode, decide whether accents stay bright or get softened.
2. **Palette.** Define the brand colors and neutrals, then derive the rest by rule, not by eye:
   - **Text shade:** for each accent, a darker shade that passes 4.5:1 on the page background, for
     links and small text.
   - **Tint:** a soft tint for chips and backgrounds, with normal text on top.
   - **Dark-mode values:** a separate set, not the same hexes on black.

   Work in **OKLCH**, and gamut-map by reducing chroma, not clipping: light blues clipped to sRGB
   turn cyan. Show a contrast table. Expect some brand colors to work only as fills, never behind
   small text.
3. **Shapes and mark.** Draw the shapes as clean vector paths on a shared grid, with one corner
   radius. Correct optically (a triangle reads smaller than a square of the same box). Show two or
   three spacing or layout options at large size **and at 16px**.

## Phase 5 · Wordmark

The longest phase. Run it as several narrow rounds. When refining a design whose lettering stays,
skip rounds 1 and 2: take the letters from the original vector files, or outline the font if its
license allows, and go on to size and position. If neither works (hand-drawn lettering only in an
image, an unknown font), say so, and run the font sweep with the original as option A.

1. **Font sweep.** Set the name in six to nine candidate fonts, **in both lowercase and capitals**,
   on the chosen mark, in light and dark. **Letter case changes the feel more than the font does**:
   say so, because humans rarely expect it.
2. **Narrow down.** Choose the winner and a backup. Record both, and why the winner won (often a
   single letter does it).
3. **Size.** Show the text height as a share of the mark's height, at three steps (for example 62,
   72 and 82%).
4. **Position.** Show the vertical alignment, at three steps, with a faint guide line through the
   mark's center. Optical center and mathematical center differ.

Outline the text to paths from the font file itself, shaped with HarfBuzz so the kerning is right.
The logo must never depend on an installed font. Check the font's license allows this (SIL OFL
fonts do).

## Phase 6 · Type pairing

Choose a **heading** face (often the wordmark's family), a **body** face that is crisper and more
structured than the heading, and a **mono** face if there's code or a terminal. Show three or four
body candidates under the same heading, in a real paragraph. The human may hand this decision to
you; if so, record that you made it, and why.

## Phase 7 · Build the kit

Write a **build script** that generates every asset from a few source files: colors, geometry,
lockup rules. Then build the deliverables in `checklist.md`:

- **Logo:** lockups, variants, PNG sizes, and a **small-size mark** with wider gaps for 32px and below.
- **Icons:** favicons, web and desktop app icons.
- **Fonts:** subset web fonts.
- **Tokens:** JSON, CSS with light and dark, Tailwind, terminal colors.
- **Components:** a component stylesheet.
- **Terminal:** a hand-drawn pixel banner, since shrunk vectors smear at terminal sizes.
- **The guide:** a guide page generated from the assets themselves. Keep its copy to labels for
  now; the prose is written in phase 8, once the voice is confirmed.
- **`BRAND.md`:** the rules and the decisions.

Requirements:

- **Contrast:** if any text pair falls under 4.5:1, the build fails.
- **Determinism:** the build is byte-for-byte repeatable. Turn off font timestamps, and check by
  building twice and comparing checksums.
- **Browser check:** look at the guide in a real browser, in both themes. Image theme switches break
  easily (an inline `display` overrides them), so check that only one logo shows.

Show the human the finished set as screenshots, and ask what feels off.

## Phase 8 · Voice

Use the **voice-brief** skill, and give it `docs/BRIEF.md` as evidence so the human isn't asked the
same questions twice. Save the result as `docs/VOICE.md`.

The voice is for the brand's **public copy**: the guide page, sites, posts. Say in the brief's scope
that the kit's own docs (`BRAND.md`, `docs/USING.md`, the README) are not covered; they stay plain and
technical, for the developers and agents who use the kit.

Then write the guide page's copy in the voice, and check it mechanically against the brief's style
rules (voice-brief step 6). Check the private-name rule across the whole repository (`git grep`).

## Phase 9 · Photography (if the brand uses photos)

1. **Plan by use, not by subject.** List where photos will go: heroes for light, dark and mobile,
   link previews, banners, email headers, category cards, error pages, backgrounds. Each use decides
   the aspect ratio and **where the empty space for text falls**.
2. **One shared base prompt** for the whole set, describing the objects, materials, colors, surface,
   light, lens and exclusions. Each shot adds only its arrangement. Template in `prompts.md`.
3. **Generate one image per job, inspect it, and retry the misses.** Expect to retry nearly half.
   To keep a series consistent, pass an earlier photo as a **reference image**.
4. **Compose for the crop.** Generators make only a few sizes, so every other aspect ratio is a crop
   decided in advance.
5. **Make the outputs:** crop and export web sizes (WebP and JPEG) with a script, keep the originals,
   and write `photography/PROMPTS.md` with the base, every final prompt, and what made each one
   work.

## Phase 10 · Hand off

Make the repository easy for a stranger, or the next agent, to use:

- **Move history out of the way:** explorations and review pages go in `archive/`, with a README
  that says they're not assets and lists what each round decided. Delete exploration scripts that
  can't run from a fresh clone, and name their commits instead.
- **One build command,** documented, with a sentence on what's generated and what's hand-made.
- **Usage guide:** `docs/USING.md` says which file to use for which job, and how to wire it into web,
  Tailwind, desktop and terminal projects. For a desktop app, it says to map `tokens.json` into the
  app's one design file, as the desktop-polish skill asks, not to add a second set of values. Test its
  copy-into-a-project steps in a throwaway copy in your scratch folder.
- **A README that maps the repo:** every folder, with a line on what's in it.
- **A project section in `AGENTS.md`:** what to read first, what's generated, what's decided and
  shouldn't be reopened without the human, and what must never be published.
- **Checks:** every link and file reference exists, a lint passes, the build is deterministic, and no
  scratch paths or temporary files remain.
- **Finish:** commit, push if the human agrees (to a private remote unless they say otherwise), record the build facts in the office, and close the work item with what's
  left for later.
