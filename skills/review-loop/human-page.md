# The human's page

The ledger is for agents. The human gets a page.

A review produces far more text than a person can parse, and the person is the
bottleneck: when they can't follow, every finding sounds dire, they can't weigh
a fix against its cost, and they can't tell you to stop. People think in
pictures. So after every round, rebuild one page that shows them what they need,
in pictures first and words second.

This file says what the page must do, not how it must look. Projects differ:
choose the diagrams and layout that fit the thing under review.

## Where and what

- **One self-contained HTML file next to the ledger**, `review-loop/report.html`,
  rebuilt after each round. Everything inline (data, styles, script): it is opened
  straight from disk, where a browser won't load a separate data file. No hosting
  needed. It goes when the `review-loop/` folder goes.
- **The chat message stays short**: the round in one line, what you need decided,
  and the path to the page.

## What it must show

1. **The stakes, at the top**, agreed with the human at the start and updated at
   each stakes check: what the thing is, who relies on it, how it is really used,
   what a failure costs, and the stop condition in their terms ("stop when
   nothing left could lose money or work in normal use").
2. **The trend across rounds**: serious and medium counts per round (after the
   disposition audit), so progress, a plateau or a slide is visible at a glance.
   Old bugs are their own line, not part of the trend.
3. **One tab per round**, the latest open. Earlier rounds can be one line each.
4. **Diagrams first.** At least:
   - **A map of the thing** (screens, parts, data, and what connects to what),
     with each finding pinned to where it lives. Draw it once; update it when the
     thing changes.
   - **A flow per serious or medium finding**: the steps that lead to it, as a
     sequence of boxes and arrows, with the step where it goes wrong marked. "Two
     phones, one second apart" should be visible as two lanes, not described.
   - Anything else that makes the round easier to see: a before/after of a fix,
     the timeline of a race, which reader found what.
5. **Each finding in the human's terms**, beside its flow: who it hits, how often
   (in plain frequency: "most trips", "two phones in the same second"), what they
   would see, what's at risk (money, work, or nothing), and what fixing it costs.
   Not the code, not the reader's wording. Label each **how you use it now** or
   **a setup you don't use**, so the human can see at a glance what matters,
   and say where it came from: **in this change**, **already there** (and where
   it was filed), or **from a fix made earlier in this review**.
6. **The decisions, in one box**: each a choice with your recommendation. A
   block (an old bug that stopped the review) comes first.
7. **Low findings folded away**, one line each.
8. **A short glossary** of every word the page uses that the human might not know.

## How it must read

- Plain words; no jargon, no file paths, no function names.
- Severity by colour, always with its word beside it, never colour alone.
- Works at phone width, and in light and dark.
- Readable in under two minutes. If it isn't, cut words, not diagrams.
