# The human's page

The ledger is for agents. The human gets a page.

A review produces far more text than a person can take in, and everything waits on that person. When they can't follow, every finding sounds dire, they can't weigh a fix against its cost, and they can't tell you to stop. People think in pictures. So after every round, rebuild one page that shows them what they need, with pictures first and words second.

This file says what the page must do, not how it must look. Projects differ, so choose the diagrams and layout that fit the thing under review.

## Where and what

- **One self-contained HTML file next to the ledger**, `review-loop/report.html`, rebuilt after each round. Put everything inline, including the data, styles and script, because the human opens the page straight from disk, where a browser won't load a separate data file. It needs no hosting. It is deleted along with the `review-loop/` folder.
- **The chat message stays short.** It gives the round in one line, what you need decided, and the path to the page.

## What it must show

1. **The stakes, at the top.** Agree them with the human at the start and update them at each check-in. They say what the thing is, who relies on it, how it is really used, what a failure costs, and the stop condition in the human's terms, for example "stop when nothing left could lose money or work in normal use".
2. **The trend across rounds.** Show the serious and medium counts per round, after the disposition audit, so that progress, a plateau or a slide is visible at a glance. Old bugs get their own line and are not part of the trend.
3. **One tab per round**, with the latest open. Earlier rounds can be one line each.
4. **Diagrams first.** At least these:
   - **A map of the thing**, showing screens, parts, data and what connects to what, with each finding pinned to where it lives. Draw it once, and update it when the thing changes.
   - **A flow for each serious or medium finding.** Show the steps that lead to it as a sequence of boxes and arrows, and mark the step where it goes wrong. "Two phones, one second apart" should be visible as two lanes, not described.
   - Anything else that makes the round easier to see, such as a before and after of a fix, the timeline of a race, or which reader found what.
5. **Each finding in the human's terms**, beside its flow. Say who it hits, and how often in plain frequency, such as "most trips" or "two phones in the same second". Say what they would see, what is at risk, whether money, work or nothing, and what fixing it costs. Do not use the code or the reader's wording. Label each finding **how you use it now** or **a setup you don't use**, so the human can see at a glance what matters. Also say where it came from: **in this change**, **already there** with where it was filed, or **from a fix made earlier in this review**. When the review covers a whole thing, only the last label applies.
6. **The decisions, in one box.** Each one is a choice with your recommendation. A block, meaning an old bug that stopped the review, comes first.
7. **Low findings folded away**, one line each.
8. **A short glossary** of every word on the page that the human might not know.

## How it must read

- Use plain words, with no jargon, no file paths and no function names.
- Show severity by colour, always with its word beside it, never by colour alone.
- Make it work at phone width, and in light and dark.
- Make it readable in under two minutes. If it isn't, cut words, not diagrams.
