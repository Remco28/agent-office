# Disposition auditor — GPT (codex gpt-6-luna, -s read-only). Saw: sorted.md, the four reports, LEDGER.md, SKILL.md, code-review profile, the live repo. Could not write. (First attempt hung waiting on stdin; rerun with </dev/null.)

# Disposition audit — Round 1

The code profile says a finding is verified if independent readers agree or it is checked against the artifact; verified HIGH and MEDIUM findings must be fixed. LOW findings may be fixed or declined with a reason. Under the profile’s stop rule, this round cannot end the review while audited HIGH findings still need fixes.

## Ratings and tiers

- **F3 should be MEDIUM, not HIGH.** The scenario is real: if `$HOME` is itself a Git repo, `init` on a subfolder writes to the repo root, and the guard checks only the named path. But reaching `$HOME` requires that unusual configuration plus an `init` invocation in one of its subfolders. The output also names the path it set up. The reviewer’s reason focuses on the blast radius, while the severity scale also considers how likely the scenario is. This fits MEDIUM’s “unusual sequence” category better. The conditional nature of the report’s “every agent” impact should be kept explicit.

- **F9 should be MEDIUM, not LOW.** The generated text names the project’s own root as the `agent-office` path, and puts that machine-specific absolute path in a file intended to be shared. This happens during ordinary initialization; it is not an edge-case input. The reason “wrong text, no wrong filing” describes the effect but does not justify LOW under the profile’s rule that visible or recoverable issues alone do not make a finding LOW. The error is visible and correctable, which fits MEDIUM.

- **F11’s tier is plausible, but its disposition is premature.** One reader reported it, so tier 2 is reasonable. But the method says a tier 2 finding must be given to another agent with the source and asked to kill it; that check is not recorded. It should remain pending that check rather than be declined as though verified.

- **F13 should not be folded into F1 on the reason given.** In `resolveScope`, a cwd-derived project is still labeled `"declared"`. Changing precedence so cwd beats a remembered project would not by itself change that label. F13 is a separate, verified LOW metadata error unless the proposed F1 fix explicitly changes the source label too.

The other listed ratings are defensible under the stated scale. F1 and F2 remain HIGH; F4, F5, and F6 are supported as MEDIUM findings. F7 and F8 are narrow cases, and F10 is an annoyance rather than a data-integrity failure. F12 is a measured cost, but its roughly 75 ms figure extrapolates a per-repo measurement to 30 repos; LOW is reasonable given the profile’s failure-oriented severity scale.

## Reasons and evidence

Most reasons are grounded in code or reproduced outcomes. The notable exceptions and qualifications are:

- **F3:** “effects reach every agent on the machine” is true only in the tracked-`$HOME` scenario; it does not establish that scenario is realistic enough for HIGH. The reviewer also records that Frank’s home is not currently a Git repo, which makes the HIGH rationale weaker for this machine.
- **F10:** the finding is overstated as written. An existing `.claude/skills` directory alone does *not* prevent startup instructions reaching Claude: when `CLAUDE.md` is absent, `init` creates a `CLAUDE.md` symlink to `AGENTS.md`. The valid case is an existing `CLAUDE.md` without the Office startup instructions. Anthropic’s documentation describes Claude Code loading `CLAUDE.md` files from the working directory and its parents, which supports that narrower concern ([Claude Code memory documentation](https://docs.anthropic.com/en/docs/claude-code/memory)).
- **F13:** “goes away if F1’s fix gives the folder its own source” is an assumption about a possible fix, not a property of the current code. The current source-label branch explicitly reports cwd fallback as `"declared"`.

The HIGH rating for F2 is well supported: `.git/info/exclude` receives an unanchored `CLAUDE.md` entry unconditionally. That hides new untracked `CLAUDE.md` files at any depth, including ones added later. The existing `.claude/skills` and `.agents/skills` paths are also excluded regardless of whether `init` created them.

## Merging and splitting

- **F4 combines two separate write paths:** following an `AGENTS.md` symlink when appending instructions, and creating `.claude/skills` through a symlinked `.claude` directory. They share the user-file-safety rule but can fail independently and need different safeguards. They should be separate findings.
- **F4 and F7 are related but describe distinct consequences** of `AGENTS.md` symlink handling: editing an outside target versus crashing on a dangling link after partial setup. Keeping the crash separate is reasonable.
- **F1’s three scenarios** share the same precedence mechanism, so grouping them is appropriate. F2’s root and nested `CLAUDE.md` cases share the same exclude-pattern mechanism; F5’s layouts share the same common-dir detection failure.

## Reader findings dropped or softened

I found no whole finding from the reports that was dropped. F10 was broadened in the sorting: its `.claude/skills` case is not valid on its own, though the existing-`CLAUDE.md` case remains.

F13 was not exactly dropped, but folding it into F1 obscures a separate metadata defect and rests on an unverified assumption about the fix.

## Cost and prior-pass bias

There is no clear evidence that a finding was rated more gently because its fix would be expensive. The strongest concern is **F3**: the reviewer’s own prior pass found the ancestor-repo problem, then the sorting raises it to HIGH while acknowledging the triggering home-repo setup is absent on this machine. That looks like impact being substituted for likelihood; it supports MEDIUM instead. For F9, the prior pass also found the issue, but the LOW rating appears to underweight the ordinary-use, visibly wrong generated text.

## May the review stop?

**No.** Even after downgrading F3, F1 and F2 remain HIGH by the audited ratings and are marked for fixes. The code-profile stop rule is not met. F11 also still needs its tier-2 kill check, and F13 should be restored as a separate finding.
