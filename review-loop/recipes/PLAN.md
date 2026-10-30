# Plan: tested recipes for starting a reader, carried by git

Stakes: the skill is used by every agent running a review, on both computers. A
bad recipe wastes a review or lets a reader into the office. Decisions: see
PROBLEM.md.

## 1. New file `skills/review-loop/readers.md`

The recipes, moved out of the tool notes. A skill says how work is done, a tool
note what is installed (AGENTS.md), so this is the right home, and it travels.
Contents, short:

- **The copy**: the rsync line, what it leaves out, where it goes, a blind
  solver's copy also leaving out the plan and `.git`.
- **Which recipe**: reading only, or running code. A table per CLI.
  - Reading: `codex -s read-only`, `grok --sandbox read-only`, `claude -p` with
    no shell, `agy` with its reader profile.
  - Running code: `codex -s workspace-write`, `grok --sandbox reader` (profile
    written into the copy), `claude -p` with named commands.
  - Local server: only the `claude -p` recipe. Otherwise the author runs it.
- **Time and output**: every recipe under `timeout`, output to a file in the
  round's scratch folder outside the copy, and how to pull the report out.
- **Before and after a run that may write**: a checksum list of the copy taken
  before, checked after. A changed or missing file is looked at before the report
  is believed. New files are fine.
- **Known failures**: run the suite yourself in a copy under the same recipe
  first and hand over the result, naming what fails because of the sandbox, so
  that is not reported as a finding.
- **Lines every brief carries**: limit each command; if something fails or time
  runs short, report what you have and what you could not check.
- **New computer**: one short probe per CLI before its first real use (office
  blocked? copy writable? home not?), because the sandboxes depend on the
  computer. A recipe that fails its probe is not a reader there.
- **What each CLI leaves behind** (`claude -p`'s empty folder).

## 2. `SKILL.md`, about the same length

- Step 3, the readers bullet: "every reader's recipe blocks the `office` command
  (the office's tool notes)" becomes a pointer to `readers.md`, as the only
  recipes to use, no improvising.
- Step 3, freeze: each round's fixes stay separate (commits or patches).
- Light review, item 1: "Write the plan plainly and freeze it (step 3)", and
  work already built gets a plan that says so and describes it; every other step
  still runs.
- At the stop: "the tool notes say what" becomes `readers.md`.

## 3. `profiles/code-review.md`, What readers get

One sentence: start a reader that runs code with `readers.md`'s recipes; only one
can start a local server, and the author reproduces what the others cannot.

## 4. `evidence.md`

A short section: what this review found, and that the fences were tested on
29 Oct without ever running a real suite through them.

## 5. Outside the repository

- Office tool notes for `codex`, `grok`, `claude`, `agy`, `reader-copy`: keep
  what is true of this computer; recipes point to `readers.md`. Remove
  `reader-copy` (its content moves).
- Memories `outside-agent-clis` and `reviewer-cannot-edit-what-it-reviews`: the
  new rule, and that writing to a throwaway copy is not editing what is reviewed.

## 6. Use test

Run the fix auditor from the finished `readers.md`, literally: copy, checksum,
recipe, report extraction, changed-file check. Run the probe. If the other
computer can be reached, probe there too.

## Not changing

The rule that readers never use the office; `human-page.md`; `briefs.md` beyond
any pointer; the opencode status (still not a reader).
