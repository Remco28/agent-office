I'll read the four brand-kit files side by side and check only whether they agree with each other and with themselves.The four files are short enough to compare line by line. I’ll search for names, paths, phase numbers, and the figures that should match.The four files share one phase list (0–10) and agree on the main kit paths, the 4.5:1 build gate, and the deterministic rebuild. No phase number is off. One conflict would make an agent ship the wrong theme; the rest would confuse a round or leave a checkbox unclear.

Severity: **HIGH** means an agent following the text would do the wrong thing. **MEDIUM** means a confused or wasted round. **LOW** means wording.

## 1. Where the files disagree

### Dark theme is optional in discovery and required at the end — HIGH

Discovery allows a light-only brand. The deliverable list and the done gate require two themes, and they do not mark dark the way they mark terminal and photography.

prompts.md line 11:

> Light only, or light and dark? If dark: cozy and warm, or neutral?

SKILL.md lines 34–35:

> Every decision gets a side-by-side render, in light and dark if the brand has both.

SKILL.md lines 72–73:

> Light only, or dark too?

checklist.md lines 14–18 require four lockup variants, including "color, dark (softened accents)", "one-color dark", and "one-color white". checklist.md line 47: "Colors with light and dark values." checklist.md lines 96–97: the guide has been looked at "in both themes" and shows "one logo per theme."

checklist.md line 3 says "Take what the brand needs" and names the skips: desktop and terminal. Photography is headed "(if used)". Dark tokens, dark lockups, and the both-themes check have no such mark. SKILL.md phase 5 (line 135) sets the wordmark "in light and dark", and phase 7 (line 174) checks the guide "in both themes", without the "if" from rule 1.

A light-only answer cannot pass the done gate without a dark theme.

### Dark accents are a decision in the procedure and a fixed label on the checklist — MEDIUM

SKILL.md line 116:

> In dark mode, decide whether accents stay bright or get softened.

checklist.md line 16 names the variant "color, dark (softened accents)". The checklist states the choice phase 4 says to ask.

### Photo-prompt file path — MEDIUM

checklist.md line 73, under Photography:

> `PROMPTS.md`: the base prompt, every final prompt, and what made each one work.

SKILL.md lines 202–204:

> write `photography/PROMPTS.md` with the base, every final prompt, and what made each one work.

In checklist.md, files in a folder carry the folder (`docs/BRIEF.md`, `archive/README.md`). This one does not. The skill file the agent reads is `prompts.md`, a third spelling.

### Mock sheet: how many real-world uses — MEDIUM

SKILL.md lines 87–88, describing the sheet the agent generates from the template:

> a few interface elements, and two or three real-world uses.

prompts.md lines 52–53, the template:

> a website header, an app card, a business card, [one or two more: T-shirt, mug, app icon].

That template lists three uses plus one or two more, so four or five. Two or three and four or five do not overlap. SKILL.md line 86 says to use that template.

### Mono face — MEDIUM

SKILL.md lines 150–151:

> a **mono** face if there's code or a terminal.

checklist.md line 40, with no condition (the Terminal section below it is conditional):

> Heading, body and mono faces chosen

A brand with no code and no terminal still has to choose a mono face to finish the checklist.

### Exclamation-mark check — MEDIUM

SKILL.md lines 185–189, the mechanical copy check:

> banned words; exclamation marks; spelling variety; private names

checklist.md lines 100–103, "Copy checks pass":

> no private names anywhere in the repository (`git grep`); no banned words; one spelling variety.

The done list drops exclamation marks. The other three checks match.

### Link-preview image with the logo — MEDIUM

checklist.md line 72:

> A default link-preview image with the logo on it.

prompts.md line 95, Share base:

> Link previews. The objects sit at one side; add the logo later

SKILL.md phase 9 step 5 (lines 202–204) lists the photo outputs as crops (WebP and JPEG), originals, and `photography/PROMPTS.md`. It does not mention a logo composite. Steps 1–4 name link previews only as a crop to plan. The checklist's other two photography bullets are restated in that step; this one is the bullet left out.

### `BRAND.md` must cover photography before photography exists — MEDIUM

checklist.md lines 77–78: `BRAND.md` includes "photography".

SKILL.md line 167 writes `BRAND.md` in phase 7. Lines 184–185 rewrite it in phase 8. Phase 9 (line 191) is the photography phase and does not mention `BRAND.md`. The section the checklist requires is not in the phase that produces the photos.

### Guessing discovery answers, including who the name comes from — MEDIUM

prompts.md lines 5–6, above the whole question bank:

> guess an answer for each when you can, so the human can just correct you.

That bank includes prompts.md lines 16–17: where the name comes from, and what personal facts must never appear.

SKILL.md lines 48–49:

> **Never invent facts about people.** Ask where the name comes from, who is behind the brand, and what must stay private.

"When you can" limits guesses to things the agent can actually infer. The name and privacy questions sit under the guess instruction with no separate exception.

### What a shot is allowed to change — MEDIUM

SKILL.md lines 196–197:

> One shared base prompt for the whole set, describing the objects, materials, colors, surface, light, lens and exclusions. Each shot adds only its arrangement. Template in `prompts.md`.

The template does not do that. prompts.md lines 66–72: the base is "identical for every shot" and includes lens and light. prompts.md lines 77–80: each shot prompt also has light, which objects, shape, placement, and size. prompts.md line 93: Hero, dark, is "the same scene at night". prompts.md line 97: the newsletter header uses "a different angle (overhead)".

Night and a new camera angle change the light and lens the base is supposed to hold fixed. This is also a self-contradiction inside prompts.md (question 2).

### Evidence cites `VOICE.md`; the procedure cites `docs/VOICE.md` — LOW

evidence.md line 65:

> that became a hard rule in `AGENTS.md`, `VOICE.md` and the office.

SKILL.md line 182 and checklist.md line 80 both say `docs/VOICE.md`. `AGENTS.md` matches. A running agent is told not to use evidence.md, so this bites a maintainer checking the claim against the procedure.

## 2. Where a file contradicts itself

### SKILL.md: minimum of three options, and rounds that allow two — MEDIUM

SKILL.md lines 38–39, a rule for every phase:

> **Three to nine options per round.** Fewer gives no real choice

SKILL.md line 86:

> Generate two or three complete style sheets

SKILL.md lines 127–128:

> Show two or three spacing or layout options

prompts.md line 35 repeats "two or three variations", so the phase text and the question bank agree with each other and disagree with the rule. Six to nine fonts (phase 5) and three or four body faces (phase 6) sit inside the three-to-nine range. An agent can satisfy both sentences by always showing three. Two is allowed by the phase and ruled out by the rule.

### prompts.md: one light for every shot, and shots that change the light — MEDIUM

Same quotes as the shot-change finding above. Inside prompts.md, the base is identical, including light, and the shot list requires night, a second camera angle, and a per-shot light slot.

### SKILL.md: one variable per round, and a font sweep that also changes case — LOW

SKILL.md line 36:

> **One variable per round.** Settle the layout, then the font, then the size, then the position.

SKILL.md lines 134–136:

> Set the name in six to nine candidate fonts, **in both lowercase and capitals**

Phase 5 tells the agent what to render, so the sweep itself is specified. The standing rule does not mention case as part of the font round.

### checklist.md: skip what the brand needs, then require both themes — see the dark-theme finding

Line 3 is the general skip. Lines 14–18, 47, and 96–97 require dark variants, dark color values, and a both-themes browser check, without the "(if …)" used for Terminal and Photography.

### SKILL.md rule 1 against phases 5 and 7 — same dark-theme finding

Rule 1 (lines 34–35) renders dark "if the brand has both". Phase 5 (line 135) and phase 7 (line 174) say light and dark with no condition.

## 3. Names, colours, fonts, objects outside evidence.md

Nothing that matches this question.

I looked through SKILL.md, prompts.md, and checklist.md for personal names, hex codes, typefaces, and named objects, and compared the examples with evidence.md (Baloo 2, `#D2EDFF`, `#E0ECFF`, coral, the blocks, the triangle, the pine table). Those specifics stay in evidence.md.

The one allowed repository name is `teamremco-style` in SKILL.md lines 28–30, once. evidence.md also says "Team Remco"; that file is in scope for this question to exclude.

Near-misses I did not count:

- checklist.md line 4, `acme-studio`, a placeholder file prefix, with no colours, fonts, or objects.
- SKILL.md lines 49–50, the example hard rule "never publish the children's names". No person is named. It is not a colour, font, or object.
- prompts.md examples: "a worn leather notebook", "a workshop at night", "small glazed ceramic cups", "a deep teal (#…), not green". Those objects and that colour are not the ones evidence.md records.
- "not universal tools for everyone" (prompts.md line 29) echoes a positioning line in evidence.md. It is not a colour, font, or object.
- Tool and platform names (Tailwind, OKLCH, HarfBuzz, GitHub, X, LinkedIn, macOS, Windows) are not a brand identity.

## 4. Checked, and not a disagreement

Phase labels match. prompts.md uses phases 1, 2, and 9. evidence.md uses phases 2, 3, and 10. Each matches that phase's title in SKILL.md.

These also match across the files: `docs/BRIEF.md`, `docs/USING.md`, `BRAND.md`, `archive/README.md`, the 4.5:1 failure rule, building twice and comparing checksums, turning off font timestamps, OKLCH with chroma reduced rather than clipped, a small-mark with wider gaps at 32px and below, the 16px preview, hand-drawn terminal art, and the voice file written before the copy rewrite.

evidence.md's claim that the checklist has no print deliverables is accurate. Discovery still asks about print and merchandise. evidence.md tells a maintainer to add print rows when a brand needs them. There are not two conflicting print lists.

"Retry about a third" (SKILL.md line 198) against "six of 14" (evidence.md lines 77–82) is already marked in evidence.md as a hypothesis. Five lockups times four variants is 20, which matches evidence.md's count of that one kit's SVGs.

I did not treat mock-sheet sections (stacked logo, 4–7 swatches, T-shirt, mug) as deliverables. SKILL.md lines 91–92 say the sheets are for reacting, not a specification.

I did not score checklist-only detail that phase 7 tells the agent to take from checklist.md: favicon sizes, the maskable icon, the interface icon set, `fonts.css`, `data-theme`, the `NO_COLOR` example, the logo filename pattern. Those are a longer list, not a second conflicting one. The photo-output step and the copy-check list are different: each is a closed list that restates its partner and drops an item.

Phase 2 being untested is stated in evidence.md and is the known quirk. I did not score it. Spelling is American in all four files.
