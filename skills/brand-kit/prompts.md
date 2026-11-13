# Prompts and question bank

## Discovery questions for phase 1

Ask **three or four at a time**, and guess an answer for each when you can, so the human can
just correct you. Skip what the conversation has already answered.

**Scope**
- Is this for one site, one product, or everything the organization makes?
- Which platforms will carry it: web, desktop apps, mobile, command-line tools, print, merchandise?
- Light only, or light and dark? If dark, should it be cozy and warm, or neutral?
- Will it need photography, or only graphics?

**Who and why**
- Who's behind it now, and who might join later? Does the copy say "I" or "we"?
- Where does the name come from? Should that story be public, and how much of it?
- Is there anything personal that must never appear, such as names, places or family details?
- What should the brand be known for, and what should it *not* be known for?

**Feeling**
- Five to ten words for how it should feel.
- Objects, places, materials or other brands that feel right. Concrete things work best: "a worn
  leather notebook", "a workshop at night".
- What should it never look like? Which brands make you think "not that"?
- Calm or lively? Refined or chunky? Geometric or hand-made?

**Positioning**
- In one sentence, what is it?
- What is it deliberately *not*? For example, "not universal tools for everyone".
- Who is the least experienced person who must still understand it?

## Mock style sheet for phase 2

Make one image per sheet, landscape, at 1536×1024 or larger. Fill in the brackets from the brief, and
generate two or three variations that differ in the least settled dimension.

> A single brand style guide sheet, laid out as a clean presentation board on a [light neutral]
> background, for a brand called "[NAME]". [ONE-SENTENCE POSITIONING.] The feeling is [IS/IS-NOT
> PAIRS, for example playful but grown-up, structured but soft, calm]. Inspired by [CONCRETE
> INSPIRATIONS]. Avoid [AVOID LIST].
>
> The sheet has clearly labeled sections:
> - **Top.** The primary logo large, with a short brand statement and a hero image.
> - **Logo variations.** Stacked, horizontal, monochrome, icon or favicon, reversed on dark, and a
>   clear-space diagram.
> - **Color palette.** [4 to 7] swatches with names and hex codes.
> - **Shape language.** Core shapes, and a few extended ones.
> - **Patterns and textures.** Two or three tiles.
> - **Typography.** A large specimen, H1, H2 and H3, and body text.
> - **UI elements.** Primary, secondary and ghost buttons, a search field, and category tags.
> - **Icons.** A row of line icons on soft tiles.
> - **Real-world examples.** A website header, an app card, a business card, and [one or two more,
>   such as a T-shirt, a mug or an app icon].
>
> The style is flat, modern, high-quality brand-agency presentation, with readable labels and
> balanced whitespace.

Afterwards, ask the human:
- Which sheet is closest?
- What do you like in each?
- What's off?

Say up front that the text and exact colors in the images will be wrong, and that it doesn't matter.

## Photography for phase 9

### Base prompt, identical for every shot in the set

> A real photograph, not an illustration or 3D render. [OBJECTS AND MATERIAL, for example small
> glazed ceramic cups with a satin finish]. The colors are exact and consistent:
> [EACH BRAND COLOR IN WORDS + HEX, with a "not X" for the way it tends to drift, for example "a deep
> teal, #…, not green"]. [COMPOSITION, for example calm and minimal], with generous empty space. [LENS
> AND LIGHT, for example a 50mm look with soft, shallow depth of field]. [EXCLUSIONS THAT FIT THE
> BRAND, for example no people, no hands]. No text, no letters, no logos, no other objects, no extra
> [objects] beyond those described.

### Shot prompt pattern

> [SURFACE AND BACKGROUND, described the same way in every shot]. [LIGHT]. [WHICH OBJECTS, exact
> shape and orientation, for example "a cup with its handle to the right,
> seen from the side, not from above"]. [WHERE THEY SIT, in fractions, for example "in the right
> third, inside the vertical middle band"]. [HOW BIG, for example "together about 40 percent of the
> width"]. [WHERE THE EMPTY SPACE IS, for example "the left 65 percent is empty table and wall"].
> [WHAT MUST VISIBLY BE HAPPENING, in physical terms, for example "one cup lies on its side, handle up"].

With a reference image from the same series, add:

> The attached reference is an earlier photo from the same series. Match its [surface, background,
> light, camera height, framing and object size] exactly. Only [what changes] changes.

### A starting shot list. Keep what the brand needs

| Shot | Shape and crop | For |
|---|---|---|
| Hero, light | 3:2 | Homepage. A mirrored copy gives space for text on the other side |
| Hero, dark | 3:2 | The same scene at night, for dark mode |
| Hero, phone | 4:5, cropped from portrait | Phones, where landscape crops badly |
| Share base | 1.91:1, which is 1200×630 | Link previews. The objects sit at one side, and the logo goes on later |
| Banner | 3:1 | GitHub, X and LinkedIn headers. The objects are small, at one end |
| Newsletter header | 2:1 | Email. A different angle, such as overhead, adds variety |
| The mark made real | 1:1 | The About page, with the logo built from real objects |
| Single objects | 4:3 each | Category cards. Make the first, then use it as the reference for the rest |
| Something gone wrong | 3:2 | 404 and error pages. A gentle joke, not a mess |
| Work in progress | 3:2 | Coming soon. Show the mark half built |
| Soft focus | 16:9 | Behind text, with everything blurred into color |
