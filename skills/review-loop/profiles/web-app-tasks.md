# Profile: web app, judged by task

For a small web app that real, non-technical people use to get a job done: a club tool, a sign-up form, a tracker. Readers use the running app the way its users would, in a browser, and never see the code.

A draft, from one project.

---

## Success question

> Can someone from the real audience complete their job in the app, starting cold and without guessing, and does it look finished enough to trust?

The task is the measurement. Every place a reader hesitates or guesses is a finding, even when the task passes.

## Checkable against a source of truth

Before spending readers, check the app against what it claims (SKILL.md step 0). Write it as scripts you can re-run each round.

| Source of truth | The check |
|---|---|
| The app's own rules (the math, the money) | Unit tests on the pure logic, e.g. shares add up to the total and balances net to zero |
| The API | A scripted run of each user flow against a local copy, asserting every response |
| The rendered page | Screenshots of every screen, light and dark, phone and laptop, looked at by you before the readers |

## House rules the artifact must obey

| Rule | How a reader tests it |
|---|---|
| Every screen says what to do next | On any screen, the reader can name the next action without scrolling or guessing |
| Every number a user acts on says what it is | Quote the label next to each amount. Unlabelled amounts are findings |
| No browser pop-ups (`alert`, `confirm`, `prompt`) | A reader never sees a native dialog |
| A destructive action asks first, in the app's own words | Delete or remove leads to a confirmation that names the thing |
| Works on a phone and a laptop | The task passes at 390x844 and at 1280x800 |

## Materials bundle

- **One private copy of the app per reader**, each with its own state, so readers never collide. For example, a local server per reader on its own port with its own database. Seed each copy with the state its task needs, using a script that only calls the app's API.
- **A headless browser** (whichever this machine has; check its tool list), with one session per reader. Readers must look at their screenshots with the Read tool, because the look is part of the test.
- **Files the persona would have**, such as a receipt photo, by absolute path.
- **Name in every brief as deliberate:** features switched off in the test copy (for example, no API key), made-up data, clipboard behaviour in a headless browser, and sticky bars that look misplaced in full-page screenshots.
- **The isolation rule, stated in every brief:** no reading files except your own screenshots and the given materials, no source, no repo, no direct API calls. It is a rule, not a sandbox, so check reports for signs it was broken.

## Cast

### Comprehension readers (one task each, the persona's own words)
| Persona | Why they are in the cast |
|---|---|
| The impatient, low-tech user doing the most common job | The main path. If this fails, nothing else matters |
| A first-time user who only needs to read one answer, fast | Is the answer the first thing they see? |
| The person with the extra role (admin, treasurer, organizer) | The less common, multi-step path |
| A second-language reader explaining the app back | Plain language, and whether the app's model of the world gets across |
| A laptop user | The layout that gets the least attention while building |

### Specialists
| Lens | Brief |
|---|---|
| Visual polish and trust | Every screen, both sizes and both modes. Rank findings by trust cost, and separate unfinished from taste |
| Accessibility | Keyboard only, accessible names, focus, contrast, target size, and dialogs and grids in particular |

### Adversaries
| Persona | The claim they test |
|---|---|
| (add as needed) | for example, "a family can't end up paying twice" |

### Retired
| Persona | Rounds run | Why retired |
|---|---|---|
