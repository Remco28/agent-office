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
| Review code | `gpt-6.2-sol` | `claude-opus-5-5` | `grok-4.7` | `gemini-4-hydrogen-high` |
| Code a well-specced task | `gpt-6.2-sol` | `claude-opus-5-5` or `claude-sonnet-5-5`, high reasoning | not chosen | `gemini-4-neon-high` |
| Design (look, layout, taste) | `gpt-6.2-astra` | `claude-fable-5-2` | not chosen | `gemini-4-argon-high` |
| Use the app in a browser | none | `claude-sonnet-5-5` | none | none |

Reasons, all chosen by Frank on 2026-11-15:

- Reading needs a solid model, not the strongest. `gpt-6-luna` is also fine for it.
- Code review gets each provider's strongest coding model. For Claude, `claude-sonnet-5-5` is the second choice.
- `gpt-6.2-sol` is cheap, follows directions very well and is highly intelligent, though below Astra. Frank's early read (2026-11-18, provisional) is that it suits code review and coding a task that is already well specified. Give it a clear spec, not an open problem.
- `gpt-6.2-astra` is highly intelligent at moderate cost and has good taste, so it is for design. It is erratic, and weaker at coding and at following directions, so do not give it code to write or a strict procedure. Treat what it returns as a proposal to check. Frank's early read (2026-11-18, provisional).
- For Claude, design gets `claude-fable-5-2`, which Frank chose for sure but which is expensive. Use it where design matters, not for every small tweak. A well-specced coding task gets Opus 5.5 or Sonnet 5.5 at a higher reasoning level (Frank, 2026-11-18).
- Grok stays as it is until Grok 4.8 arrives, so Grok has no design or coding pick. Use `grok-4.7` only for the jobs it already has (Frank, 2026-11-18).
- Both 6.2 rows are a gut call from the first days. They need more evaluation. When one is tested, correct the row and say what you saw.
- Grok has one model worth using, `grok-4.7`.
- Gemini uses Hydrogen for reading and review. Argon is weaker for that, so it is not used there.
- Gemini design gets `gemini-4-argon-high`, which is very expensive, so use it sparingly. Well-specced coding gets `gemini-4-neon-high`, a newer model (Frank, 2026-11-18).
- Screenshots count as reading. Any model in the table can see images, so a UI reader is a prose reader that is given images.
- Using the app means driving a browser against a local server. In the review-loop sandbox only Claude can start one (see `../review-loop/readers.md`), so the other columns are empty for that job.

The CLI has to pass the image to the model too. On 2026-11-15, Codex 0.169.0 (read-only sandbox), Grok 1.0.77 (strict sandbox) and agy 1.5.9 each opened a PNG from their folder and read a random code in it correctly. If you add a provider, test it the same way before you give it screenshots.

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
| `gemini-4-argon-*` for reading and review | Weaker than Hydrogen. Still used for design, see the table | 2026-11-15 |
