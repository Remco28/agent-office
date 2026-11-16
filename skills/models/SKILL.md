---
name: models
description: Which model to use for each job when you start another agent, such as a review-loop reader or a Codex, Grok, Gemini or Claude agent you hand work to. One table by job and provider, and how to check it against what each CLI offers before you start. Use it whenever you pick a model for another agent.
---

# Models

Skills name the job, and this table names the model. No other skill or recipe names a model. A recipe that starts an agent, such as one in `../review-loop/readers.md`, has `<model>` where the name goes, and you fill it in from here.

The choices are the human's. Models change every few weeks, so the table is checked each time it is used, not on a schedule.

## The table

| Job | Codex | Claude | Grok | Gemini |
|---|---|---|---|---|
| Read prose or screenshots | `gpt-6.1-terra` | `claude-sonnet-5-5` | `grok-4.7` | `gemini-4-hydrogen-high` |
| Review code | `gpt-6.1-sol` | `claude-opus-5-5` | `grok-4.7` | `gemini-4-hydrogen-high` |
| Use the app in a browser | none | `claude-sonnet-5-5` | none | none |

Reasons, all chosen by Frank on 2026-11-15:

- Reading needs a solid model, not the strongest. `gpt-6-luna` is also fine for it.
- Code review gets each provider's strongest coding model. For Claude, `claude-sonnet-5-5` is the second choice.
- Grok has one model worth using, `grok-4.7`.
- Gemini uses Hydrogen for everything. Argon is weaker.
- Screenshots count as reading. Any model in the table can see images, so a UI reader is a prose reader that is given images.
- Using the app means driving a browser against a local server. In the review-loop sandbox only Claude can start one (see `../review-loop/readers.md`), so the other columns are empty for that job.

Seeing images depends on the CLI as well as the model. The office's tools list says, as of 2026-10-27, that among the outside CLIs only `agy` sees images. Check that note in `office tools` before you give screenshots to a Codex or Grok reader, and if it still holds, use only Claude and Gemini for screenshots.

## Before you start an agent

1. **Find the row for the job.** If no row fits, ask the human which model to use for each provider, and add a row with their reason and the date.
2. **Check that each model is still offered.** List what each CLI has:
   ```bash
   codex debug models | jq -r '.models[].slug'
   grok models
   agy models
   ```
   Claude Code has no list command. A model it does not offer fails at once, so start the agent and read the error.
3. **If a model in the table is gone**, use the nearest one from the same provider, meaning the same family at a newer version or the same tier. Say which you used in the ledger or your work note, and tell the human.
4. **If a provider offers a newer model than the table has**, ask the human before you use it, in one line. For example: "Codex now offers gpt-6.2-sol. Use it for code review in place of gpt-6.1-sol?" Newer means a higher version of a family in the table, or a family that is new. Skip anything listed under *Passed over*.
5. **Record the answer.** On a yes, change the cell, its reason and the date. On a no, add the model to *Passed over* with the reason. Then commit, so the other computer gets it. Pushing is the human's call.

When the human says a model is poor, change the table the same way, even if no agent is being started.

## Passed over

| Model | Why | Date |
|---|---|---|
| `gemini-4-argon-high` and the other Argon levels | Weaker than Hydrogen | 2026-11-15 |
