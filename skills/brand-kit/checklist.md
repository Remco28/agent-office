# Deliverables and definition of done

Take what the brand needs. A web-only brand skips the desktop and terminal rows. The names below use
`<brand>` for the brand's file prefix, for example `acme-studio`.

## Logo

- [ ] Lockups as **pure-outline SVG**, with no live text and no strokes left to convert:
  - horizontal;
  - vertical, for square spaces;
  - mark only;
  - **small mark**, with wider gaps, for 32px and below;
  - wordmark only.
- [ ] Each lockup in four variants:
  - color, for light backgrounds;
  - color, dark, with softened accents;
  - one-color dark;
  - one-color white.
- [ ] PNG exports at a few heights per lockup.
- [ ] One naming pattern for everything: `<brand>-<layout>-<variant>[-<height>].<ext>`.
- [ ] Clear space and minimum sizes decided, and written down.

## Icons

- [ ] `favicon.svg`, which switches to dark colors with `prefers-color-scheme`.
- [ ] `favicon.ico` at 16, 32 and 48.
- [ ] `apple-touch-icon.png` at 180, full-bleed.
- [ ] Web app icons at 192 and 512, plus a maskable 512 that keeps the mark inside the 80% safe
      circle, and `site.webmanifest`.
- [ ] Desktop app icons, light and dark:
  - macOS `.icns`, on the inset 824/1024 grid;
  - Windows `.ico`, 16 to 256;
  - a PNG set, 16 to 1024, with names that explain themselves;
  - the SVG sources.
- [ ] Interface icons. Pick an open icon set that matches the shapes, and keep a starter set with its
      license.

## Type

- [ ] Heading, body and mono faces chosen, and their licenses checked. Prefer SIL OFL.
- [ ] Source TTFs and their license texts committed.
- [ ] Web fonts: Latin-subset variable woff2, plus a `fonts.css` with `@font-face` and `font-display: swap`.

## Tokens and components

- [ ] `tokens.json`, the source of truth for non-web projects.
- [ ] Colors with light and dark values.
- [ ] Type scale, spacing, radii, shadows and motion.
- [ ] `tokens.css` with prefixed variables:
  - light by default;
  - dark through `prefers-color-scheme`;
  - a `data-theme` override.
- [ ] Each accent color has a **fill**, a **text** shade that passes 4.5:1 on the background, and a **tint**.
- [ ] Tailwind, as a v4 `@theme` file, a v3 preset or both, mapping to the live CSS variables.
- [ ] Terminal colors by role, as hex plus the nearest 256-color code. The roles are text, muted,
      success, warning, error and info.
- [ ] A component stylesheet:
  - base styles for body, headings, links and code;
  - buttons, input or search, chips, cards and icon tiles;
  - any texture utilities;
  - helpers to swap images with the theme.
- [ ] Token names that don't collide. For example, use `fg` for the text color, so Tailwind doesn't
      produce `text-text`.

## Terminal, if there are command-line tools

- [ ] A banner as **hand-drawn pixel art**, in truecolor, 256-color and plain text, plus a compact version.
- [ ] A short example that picks the right file from `NO_COLOR`, the TTY and `COLORTERM`.

## Photography, if used

- [ ] Originals kept, and web crops as WebP and JPEG at a few widths, made by a script.
- [ ] A default link-preview image with the logo on it.
- [ ] `photography/PROMPTS.md`, with the base prompt, every final prompt, and what made each one work.

## Documents

- [ ] `BRAND.md`, covering the idea, the logo rules including the don'ts, the color roles, the type,
      the shapes, photography, icons, and **how the logo was drawn**, with every number and why.
- [ ] `docs/BRIEF.md`, the confirmed discovery brief.
- [ ] `docs/VOICE.md`, the confirmed voice brief, scoped to the public copy.
- [ ] `docs/USING.md`, which says which file to use for which job, how to wire it into web, Tailwind,
      desktop and CLI projects, and how to copy the kit into a project.
- [ ] `README.md`, with a map of every folder, the one build command, and which source controls what.
- [ ] A project section in `AGENTS.md`:
  - what to read first;
  - what's generated and what's hand-made;
  - what's decided;
  - what must never be published.
- [ ] A visual guide page generated from the assets, with a switch between light and dark.
- [ ] `archive/README.md`, if any explorations are kept.

## Done means

- [ ] One build command regenerates everything, and **two builds give identical checksums**.
- [ ] The build fails if any text pair drops under 4.5:1.
- [ ] Someone has looked at the guide in a browser in both themes, and it has no broken images and
      one logo per theme.
- [ ] Every link and file reference in the docs exists.
- [ ] The scripts pass a lint.
- [ ] The copy-into-a-project steps in `docs/USING.md` work in a throwaway copy in your scratch folder.
- [ ] Copy checks pass:
  - no private names anywhere in the repository, checked with `git grep`;
  - the public copy meets the voice brief's style rules, checked mechanically.
- [ ] No scratch paths, temporary files or explorations among the real assets.
- [ ] Committed, and pushed if the human agreed, to a private remote unless the human said otherwise.
      The build facts, and where the decisions live, are recorded in the office, and the work item is
      closed with what's left for later.
