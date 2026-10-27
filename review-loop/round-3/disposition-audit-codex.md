# Disposition audit — Round 3

## 1. Ratings and tiers

**H1–H4 at MEDIUM hold.** Each is supported by the code or a reproduction, and each describes a silent or externally visible failure in an unusual layout. H2 is especially well supported: the key changes after the main checkout initializes the nested submodule, leaving prior notes under the old key. The reviewer also correctly brought H3 and H4 to MEDIUM despite their unusual setups.

Several LOW ratings should be higher under the stated severity scale:

- **H5: LOW → MEDIUM.** In the affected layouts, the wrong project name is written into `AGENTS.md` and shown in the banner. The reviewer’s own reason says it is wrong in a committed file and recoverable, which fits the profile’s MEDIUM criteria for visibly wrong and recoverable behavior.
- **H7: LOW → MEDIUM.** The reason is “Rare timing.” The profile explicitly says a finding that occurs only in rare timing is MEDIUM, never LOW. The source confirms the race: init plans to create a missing file, then uses `writeFileSync` without an exclusive-create flag.
- **H10: LOW → MEDIUM.** A linked worktree of a home-rooted repository can be reported as “set up” even though folder detection returns no project. The mismatch is visible and recoverable, and occurs in an unusual setup—the profile’s MEDIUM case. The stated reason, “Visible,” cannot by itself justify LOW.
- **H11: LOW → MEDIUM.** Its reason is also “Rare timing,” so the profile’s rule applies. The “nothing damaged” claim is not secure: both processes can decide to append before either writes, and the code then appends both sections. The reader did not reproduce that duplicate, but the code leaves the race open.
- **H12: LOW → MEDIUM.** The reported `.git` symlink case makes `git init` write into a directory outside the project. Calling the setup “contrived” describes its rarity; the profile assigns unusual sequences MEDIUM. This is also hard to distinguish in severity from H4, which is MEDIUM for an unusual filesystem alias that changes an outside file.

**H6, H8, H9, and H13 at LOW are defensible.** H6 is an old launcher value taking the precedence assigned to a declared project; H8 and H13 are wording problems; H9 requires an unusual PATH and fails visibly.

**H14 is not ready for a final tier or rating.** Sorted.md assigns Tier 2, but the skill requires a second agent to try to kill a Tier 2 finding before it is promoted. The original reader explicitly said this was “not a finding,” and no kill check is recorded. The code does leave `GIT_TEMPLATE_DIR` in the environment passed to `git init`, but the claim that the supplied template hides `AGENTS.md` still needs the prescribed check. Its LOW rating and fix recommendation are premature.

The Tier 1 labels are otherwise plausible where the sorter checked the source or reproduced the behavior. The report should make that verification explicit for single-reader findings, as the tier rule requires artifact checking when independent readers do not corroborate a finding.

## 2. Are the reasons real?

Most reasons accurately describe the scenarios, but several do not support the assigned severity:

- H7 and H11 use “rare timing” to justify LOW, directly contrary to the profile.
- H10 uses visibility to justify LOW, although the profile says visibility alone does not make a finding LOW.
- H11’s “nothing damaged” overlooks the possible duplicate append. That outcome was not reproduced, so it should be described as a code-supported possibility, not a confirmed result.
- H12’s “contrived” explains why the scenario is unusual; it does not resolve the severity under the stated scale.
- H5’s “nothing misfiled” is true but incomplete: the wrong name is still written into a committed file and displayed to the user.

The H1 reason is sound: init’s success message is visible and the setup is recoverable, while later agents can silently receive the wrong instructions. The H2–H4 reasons also match the reports and source.

## 3. Merged or split findings

**H1 combines two bypasses:** repositories deeper than the scan limit, and repositories reached through symlinked folders. They share the same guard and downstream harm, so grouping them is understandable, but they are independently triggered and need different coverage. Keep a common parent finding if useful, but track the two cases separately.

**H8 also combines two documentation issues:** help contradicts itself about editing an existing file, and its `--project` guidance is stricter than the project instructions. They need different wording changes and should be listed separately.

The remaining findings are reasonably separate. In particular, H3 and H10 both involve home-rooted repositories but fail through different paths: project-key detection for separate-git-dir, versus init’s linked-worktree check. H4 and H12 also involve different write mechanisms.

## 4. Dropped or softened findings

No reader finding appears to have been dropped. The reports’ concrete findings are represented in H1–H13, and the monorepo behavior is recorded as intentional. H14 was added from Grok’s explicitly non-finding observation, but it should remain pending the Tier 2 kill check rather than being treated as a settled finding.

## 5. Earlier-pass bias and fix cost

The H2 row openly records that the reviewer accepted this cost in pass 3 without rating it. That is a clear example of an earlier judgment being carried forward too softly; Round 3 corrected it to MEDIUM, so the current rating is fair.

I see no direct evidence that implementation cost lowered a rating. However, declining H11 on “rare timing” while recommending the small `wx` fix for H7 is inconsistent with the profile and warrants the MEDIUM re-rating. H14’s “cheap to remove” is not a substitute for verifying the finding.

## 6. May the review stop?

**No.** Even before the re-ratings, H1–H4 are MEDIUM findings with fixes recommended. The code-review stop rule requires a round with no audited HIGH and no HIGH or MEDIUM fixes needed. H7 and H11 should also be MEDIUM, with H5, H10, and H12 likely MEDIUM under the stated scale.

The review cannot stop after this round. Any HIGH or MEDIUM fixes must go through the peer step, and the resulting code needs a round with a fix auditor before applying the stop rule.
