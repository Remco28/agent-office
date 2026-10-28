# Deliverables and definition of done

Take what the brand needs; a web-only brand skips the desktop and terminal rows. Names below use
`<brand>` for the brand's file prefix (for example `acme-studio`).

## Logo

- [ ] Lockups as **pure-outline SVG** (no live text, no strokes left to convert):
  - horizontal;
  - vertical (for square spaces);
  - mark only;
  - **small mark** (wider gaps, for 32px and below);
  - wordmark only.
- [ ] Each in four variants:
  - color, for light backgrounds;
  - color, dark (softened accents);
  - one-color dark;
  - one-color white.
- [ ] PNG exports at a few heights per lockup.
- [ ] One naming pattern for everything: `<brand>-<layout>-<variant>[-<height>].<ext>`.
- [ ] Clear space and minimum sizes decided, and written down.

## Icons

- [ ] `favicon.svg`, which switches to dark colors with `prefers-color-scheme`.
- [ ] `favicon.ico` (16, 32, 48).
- [ ] `apple-touch-icon.png` (180, full-bleed).
- [ ] Web app icons, 192 and 512, plus a maskable 512 that keeps the mark inside the 80% safe circle;
      `site.webmanifest`.
- [ ] Desktop app icons, light and dark:
  - macOS `.icns` (inset 824/1024 grid);
  - Windows `.ico` (16–256);
  - PNG set (16–1024) with self-explaining names;
  - the SVG sources.
- [ ] Interface icons: pick an open icon set that matches the shapes, and keep a starter set with its
      license.

## Type

- [ ] Heading, body and mono faces chosen; licenses checked (prefer SIL OFL).
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
- [ ] Each accent color has a **fill**, a **text** shade (4.5:1 on the background) and a **tint**.
- [ ] Tailwind (a v4 `@theme` file and/or a v3 preset), mapping to the live CSS variables.
- [ ] Terminal colors by role (text, muted, success, warning, error, info), as hex plus the nearest 256-color code.
- [ ] A component stylesheet:
  - base styles for body, headings, links and code;
  - buttons, input or search, chips, cards and icon tiles;
  - any texture utilities;
  - helpers to swap images with the theme.
- [ ] Token names that don't collide. For example, use `fg` for the text color, so Tailwind doesn't
      produce `text-text`.

## Terminal (if there are command-line tools)

- [ ] A banner as **hand-drawn pixel art**, in truecolor, 256-color and plain text, plus a compact version.
- [ ] A short example that picks the right file from `NO_COLOR`, the TTY and `COLORTERM`.

## Photography (if used)

- [ ] Originals kept; web crops as WebP and JPEG at a few widths, made by a script.
- [ ] A default link-preview image with the logo on it.
- [ ] `photography/PROMPTS.md`: the base prompt, every final prompt, and what made each one work.

## Documents

- [ ] `BRAND.md`: the idea, the logo rules (including don'ts), the color roles, the type, the shapes,
      photography, icons, and **how the logo was drawn** (every number, and why).
- [ ] `docs/BRIEF.md`: the confirmed discovery brief.
- [ ] `docs/VOICE.md`: the confirmed voice brief, scoped to the public copy.
- [ ] `docs/USING.md`: which file for which job; how to wire it into web, Tailwind, desktop and CLI
      projects; how to copy the kit into a project.
- [ ] `README.md`: a map of every folder, the one build command, and which source controls what.
- [ ] A project section in `AGENTS.md`:
  - what to read first;
  - what's generated and what's hand-made;
  - what's decided;
  - what must never be published.
- [ ] A visual guide page generated from the assets, with a light/dark switch.
- [ ] `archive/README.md`, if any explorations are kept.

## Done means

- [ ] One build command regenerates everything, and **two builds give identical checksums**.
- [ ] The build fails if any text pair drops under 4.5:1.
- [ ] The guide has been looked at in a browser in both themes: no broken images, and one logo per theme.
- [ ] Every link and file reference in the docs exists.
- [ ] The scripts pass a lint.
- [ ] `docs/USING.md`'s copy-into-a-project steps work in a throwaway folder.
- [ ] Copy checks pass:
  - no private names anywhere in the repository (`git grep`);
  - the public copy meets the voice brief's style rules, checked mechanically.
- [ ] No scratch paths, temporary files or explorations among the real assets.
- [ ] Committed, and pushed if the human agreed. The build facts, and where the decisions live, are
      recorded in the office, and the work item is closed with what's left for later.
