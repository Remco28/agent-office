---
name: brand-kit
description: Create a complete brand identity with the human, usually from scratch but also by refining an existing design, and ship it as a documented, rebuildable brand-kit repository. Covers discovery, a generated mock style sheet, palette, shapes and mark, wordmark, type, logo files, icons, design tokens, components, voice, photography and handoff. Use when the human wants a new brand, logo or style guide for an organization, product or site. It is long and interactive, with many rounds with the human. Not for small logo tweaks or for applying an existing brand to a project. For an app's interface values without a new identity, use desktop-polish. For a writing voice alone, use voice-brief.
---

# Brand kit

A brand is a series of **small decisions the human makes by looking**, then a build that turns
those decisions into files any project can use. This skill gives the order of those decisions, how
to present each one, and what the finished kit must contain.

The human decides taste. The agent proposes, renders, checks and records. Most humans have never
made a brand before. Lead the process and **ask one small set of questions at a time**. Recommend
an answer each time, but never decide taste for them without saying so.

Most brands made with this skill are new. It can also **refine an existing design**. The phases are
the same, and phase 2 says what changes.

Take only the phases a project needs. A single-site brand may skip desktop icons, and a brand
without photos skips phase 9. Keep the order, though, because later phases depend on earlier answers.

Supporting files:
- [`prompts.md`](prompts.md) has the discovery questions, the mock style sheet prompt and the photo prompts.
- [`checklist.md`](checklist.md) lists every deliverable and the definition of done.
- [`evidence.md`](evidence.md) explains why the rules are what they are. It is for maintaining the skill, not for running it.

The `teamremco-style` repository is a finished example of everything here. Its `BRAND.md`,
`docs/USING.md` and `scripts/` show one way to do each phase. Read it if you can find it, but don't
copy its colors, fonts or shapes, because those were one human's taste.

## Rules for every phase

1. **Show, don't describe.** Every decision gets a side-by-side render, in light and dark if the
   brand has both. Nobody can choose between font names or hex codes in a sentence.
2. **One variable per round.** Settle the layout, then the font, then the size, then the position.
   When a round compares everything at once, the human says "I like parts of all of them".
3. **Two to nine options per round.** One gives no real choice, and more than nine is too many to
   take in. Whole style sheets are costly, so offer two or three. Detail rounds usually have more.
   Label the options A, B, C and so on, so the human can answer in one word.
4. **Recommend, then accept the gut.** Say which option you'd pick and why. If the human picks
   another, take it. "B looks floaty" is a real reason, and good brands are made from reasons like
   that. Keep the losing option's settings as one parameter, in case they change their mind.
5. **Write each decision down as it's made, with its reason,** in the project's docs. That means
   `BRAND.md`, or a decisions list until `BRAND.md` exists. Commit after every round. The reason is
   what stops the next agent from reopening the question. In the office, remember only what the next
   agent would otherwise rediscover: where the decisions live, hard rules such as privacy, and build
   facts.
6. **Keep explorations apart from final assets.** From the start, put round outputs in an
   `explorations` or `archive` folder, never next to the real logo files.
7. **Never invent facts about people.** Ask where the name comes from, who is behind the brand,
   and what must stay private. Record privacy rules as hard rules, for example "never publish the
   children's names".
8. **Check by machine what a machine can check.** That covers contrast, file sizes, broken links and
   stray words. Leave taste to the human.
9. **Say where you are.** Open each round by naming the phase, this round's one question, and what
   comes after it. A human who has never made a brand can't see how far the process goes.

## Phase 0 · Set up

- **Repository.** The kit gets its own repository, and one agent works in one repository. If you are
  not already in the kit's repository, agree a name and folder with the human. The folder goes beside
  their other projects, not inside one, because init refuses that. Run `office init <folder>`, which
  creates the git repository, and do nothing else there. Write the human a short paragraph to paste
  into a new agent started in that folder. It says to use the brand-kit skill from phase 0, what they
  asked for, where any existing design files are, and anything already decided. Then stop. The new
  agent begins this phase again, inside the kit's repository, with a first commit and an office work
  item.
- **Tools.** Check what this machine has. Install only what's missing, at user level, and record each
  tool in the office. The usual needs are:
  - a Python environment for the project, using `uv`, with fontTools, uharfbuzz and Pillow;
  - an SVG-to-PNG renderer, `resvg`;
  - a headless browser for screenshots.
- **Image generation.** Find out whether any of the human's subscriptions can generate images. Look
  at the office's tool list first. **Make one test image, in your scratch folder, before planning
  around it.** If nothing can generate images, say so plainly. Phase 2's sheets then become SVG or
  HTML boards you build, and phase 9's plan becomes a shot list for a photographer or a phone.

## Phase 1 · Discovery

Goal: a short **brand brief** the human confirms, saved as `docs/BRIEF.md`.

Ask in small batches. The question bank is in `prompts.md`. Cover these topics:

- **Scope.** Is it for one site, one product, or the whole organization? Light only, or dark too?
  Which platforms: web, desktop, mobile, command line, print? If they need print, say that this skill
  doesn't cover print files yet, and write in the brief what they'll need.
- **Who and why.** Who is behind it, where the name comes from, and what must stay private.
- **Feeling.** Five to ten words for how it should feel, the inspirations such as objects, places
  and other brands, and an **avoid list**. The avoid list often says more than the wish list.
- **Positioning.** What it is, what it deliberately isn't, and who it's for.

If the human pastes a description from elsewhere, treat it as input to the brief, not as the brief
itself. Turn vague words into **is / is-not pairs**, such as "playful, not childish".

## Phase 2 · Mock style sheet

Goal: the human reacts to **whole looks** before anyone designs a detail.

From the brief, generate two or three complete style sheets, each a single image, using the
template in `prompts.md`. A sheet shows the logo variants, palette, shapes, patterns, type, a few
interface elements and icons, and a few real-world uses. Make the sheets differ in the dimension
that's least settled, for example calm against lively, or geometric against hand-made.

These sheets are **for reacting to, not a specification**. Ask what they like, what's off, and which
sheet is closest. Expect image models to get text and exact colors wrong. That doesn't matter here.

If the human arrives with a mock-up of a new look, made elsewhere, skip the generation and use theirs
as the chosen sheet. A design already in use, to be refined, is different, as described below.

**Refining an existing design.** Ask for the original files: vector files if they exist, otherwise
the best image there is. Show the design back as it is, large and at 16px, in light and dark, and ask
what must stay recognizable and what bothers them. Then make the two or three sheets differ in how far
they move from the original. For example, one sheet tidies the same mark, one redraws the mark, and
one has a new mark that keeps only the colors. Pass the original to the generator as a reference
image. With no generator, build the sheets as boards from the original. The extraction plan in phase
3 then says what stays and what changes. In phases 4 and 5, a part that stays starts from the
original's files, not from nothing.

## Phase 3 · Extraction plan

Goal: the human approves a plan before you build anything.

From the chosen sheet, list:

- **What to keep.** The elements to turn into real files.
- **What can't be reproduced honestly**, with an alternative for each. Painterly textures and
  photos don't survive as vectors.
- **What breaks a rule.** For example, text on a bright color that fails contrast. Check this early,
  with numbers.
- **The deliverables**, from `checklist.md`, and the folder layout.

Show the plan as a short list and ask whether to go ahead or change it.

## Phase 4 · Foundations

Run visual rounds, one decision each:

1. **Mood and texture.** Decide where the warmth comes from: flat color, a subtle texture, cut-paper
   shadows or photography. In dark mode, decide whether accents stay bright or get softened.
2. **Palette.** Define the brand colors and neutrals, then derive the rest by rule, not by eye.
   - **Text shade.** For each accent, a darker shade that passes 4.5:1 on the page background, for
     links and small text.
   - **Tint.** A soft tint for chips and backgrounds, with normal text on top.
   - **Dark-mode values.** A separate set, not the same hex values on black.

   Work in **OKLCH**, and gamut-map by reducing chroma, not by clipping. Light blues clipped to sRGB
   turn cyan. Show a contrast table. Expect some brand colors to work only as fills, never behind
   small text.
3. **Shapes and mark.** Draw the shapes as clean vector paths on a shared grid, with one corner
   radius. Correct for how the eye sees them. A triangle looks smaller than a square in the same box.
   Show two or three spacing or layout options at large size **and at 16px**.

## Phase 5 · Wordmark

This is the longest phase. Run it as several narrow rounds. When you refine a design whose lettering
stays, skip rounds 1 and 2. Take the letters from the original vector files, or outline the font if
its license allows, and go on to size and position. If neither works, for example because the
lettering is hand-drawn and exists only in an image, or the font is unknown, say so. Then run the font
sweep with the original as option A.

1. **Font sweep.** Set the name in six to nine candidate fonts, **in both lowercase and capitals**,
   on the chosen mark, in light and dark. **Letter case changes the feel more than the font does.**
   Say so, because humans rarely expect it.
2. **Narrow down.** Choose the winner and a backup. Record both, and why the winner won. Often a
   single letter decides it.
3. **Size.** Show the text height as a share of the mark's height, at three steps, for example 62,
   72 and 82%.
4. **Position.** Show the vertical alignment at three steps, with a faint guide line through the
   mark's center. The center the eye sees and the mathematical center differ.

Outline the text to paths from the font file itself, shaped with HarfBuzz so the kerning is right.
The logo must never depend on an installed font. Check that the font's license allows this. SIL OFL
fonts do.

## Phase 6 · Type pairing

Choose a **heading** face, which is often the wordmark's family. Choose a **body** face that is
crisper and more structured than the heading, and a **mono** face if there's code or a terminal. Show
three or four body candidates under the same heading, in a real paragraph. The human may hand this
decision to you. If so, record that you made it, and why.

## Phase 7 · Build the kit

Write a **build script** that generates every asset from a few source files: colors, geometry and
lockup rules. Then build the deliverables in `checklist.md`:

- **Logo.** Lockups, variants, PNG sizes, and a **small-size mark** with wider gaps for 32px and below.
- **Icons.** Favicons, and web and desktop app icons.
- **Fonts.** Subset web fonts.
- **Tokens.** JSON, CSS with light and dark, Tailwind, and terminal colors.
- **Components.** A component stylesheet.
- **Terminal.** A hand-drawn pixel banner, because vectors shrunk to terminal sizes smear.
- **The guide.** A guide page generated from the assets themselves. Keep its copy to labels for
  now. You write the prose in phase 8, once the human has confirmed the voice.
- **`BRAND.md`.** The rules and the decisions.

Requirements:

- **Contrast.** If any text pair falls under 4.5:1, the build fails.
- **Determinism.** The build is byte-for-byte repeatable. Turn off font timestamps, and check by
  building twice and comparing checksums.
- **Browser check.** Look at the guide in a real browser, in both themes. Image theme switches break
  easily, because an inline `display` overrides them. Check that only one logo shows.

Show the human the finished set as screenshots, and ask what feels off.

## Phase 8 · Voice

Use the **voice-brief** skill, and give it `docs/BRIEF.md` as evidence so nobody asks the human the
same questions twice. Save the result as `docs/VOICE.md`.

The voice is for the brand's **public copy**, such as the guide page, sites and posts. Say in the
brief's scope that it does not cover the kit's own docs, which are `BRAND.md`, `docs/USING.md` and the
README. Those stay plain and technical, for the developers and agents who use the kit.

Then write the guide page's copy in the voice, and check it mechanically against the brief's style
rules, as voice-brief step 6 describes. Check the private-name rule across the whole repository with
`git grep`.

## Phase 9 · Photography, if the brand uses photos

1. **Plan by use, not by subject.** List where photos will go: heroes for light, dark and mobile,
   link previews, banners, email headers, category cards, error pages and backgrounds. Each use decides
   the aspect ratio and **where the empty space for text falls**.
2. **Write one shared base prompt** for the whole set, describing the objects, materials, colors,
   surface, light, lens and exclusions. Each shot adds only its arrangement. The template is in
   `prompts.md`.
3. **Generate one image per job, inspect it, and retry the misses.** Expect to retry nearly half.
   To keep a series consistent, pass an earlier photo as a **reference image**.
4. **Compose for the crop.** Generators make only a few sizes, so every other aspect ratio is a crop
   you decide in advance.
5. **Make the outputs.** With a script, crop and export web sizes as WebP and JPEG, and keep the
   originals. Write `photography/PROMPTS.md` with the base prompt, every final prompt, and what made
   each one work.

## Phase 10 · Hand off

Make the repository easy for a stranger, or the next agent, to use:

- **Move history out of the way.** Put explorations and review pages in `archive/`, with a README
  that says they're not assets and lists what each round decided. Delete exploration scripts that
  can't run from a fresh clone, and name their commits instead.
- **One build command,** documented, with a sentence on what's generated and what's hand-made.
- **Usage guide.** `docs/USING.md` says which file to use for which job, and how to wire it into web,
  Tailwind, desktop and terminal projects. For a desktop app, it says to map `tokens.json` into the
  app's one design file, as the desktop-polish skill asks, not to add a second set of values. Test its
  copy-into-a-project steps in a throwaway copy in your scratch folder.
- **A README that maps the repo.** It lists every folder, with a line on what's in it.
- **A project section in `AGENTS.md`.** It says what to read first, what's generated, what's decided
  and shouldn't be reopened without the human, and what must never be published.
- **Checks.** Every link and file reference exists, a lint passes, the build is deterministic, and no
  scratch paths or temporary files remain.
- **Finish.** Commit. Push if the human agrees, to a private remote unless they say otherwise. Record
  the build facts in the office, and close the work item with what's left for later.
