# Profile: explainer-public

This profile is for a public page that explains one piece of technical or scientific work to people who do not have the training to read the source. It comes from six rounds on one such page, and its cast and house rules are what that work settled on.

---

## Success question

> A reader who knows nothing about the field should finish able to say, in their
> own words, **both what the work showed and what it did not show.**

The second half is the unusual part, and it is what this kind of page is for. Almost all public science writing delivers the first half and leaves out the second.

## House rules the artifact must obey

Each rule has a test, so a reader can check compliance rather than offer an opinion.

1. **A non-detection is never written as an equality.** "No difference was detected" is not "there was no difference." *Test: find a sentence that states a negative result. Does another part of the page hedge the same result more carefully?*
2. **An association is never written as a cause.**
3. **The caveat belongs inside the sentence that makes the claim, not after it.** A claim followed by a paragraph of limitations reads as a claim and a retraction, and a reader keeps only the claim.
4. **The simple version may compress, but it may never claim more than the careful version.** *Test: read all reading levels of the same passage side by side.*
5. **A term is glossed where it first appears.**
6. **The page keeps the promises it makes about itself.** That covers the naming conventions it states, the cross-references it offers and the questions it raises. *Test: find every sentence of the form "X comes later" and check that X arrives.*

Rule 6 produced the best finding of round 4 and the best of round 3. It is the cheapest rule to check and the one most likely to be broken, because the author makes promises early and keeps them late, after moving on to other things.

## Materials bundle

- **Comprehension readers** get the rendered page as an ordered series of screenshots, plus a text extract in reading order at their reading level.
- **Specialists** get whatever their lens needs. Accessibility and defect readers get the **real source and the real scripts**, and you must tell them which attributes the scripts set at runtime instead of the markup.
- **The depth-consistency reader** gets all reading levels as separate complete passes.
- Say in every brief that the captures show animations at their finished state on purpose, and that this is not a fault.

## Cast

**A starting cast, not a fixed one**, as SKILL.md says. The readers that found the most were invented for a particular round and are not in this table.

### Comprehension readers
| Persona | Why they are in the cast |
|---|---|
| Curious adult, no training | The target reader |
| Eleven-year-old | Tests the simplest level, and catches unexplained words fastest |
| Domain specialist who did not do the work | The only reader who can catch a misstatement |
| Non-native English reader, about B2 | **Best value in round 4.** A page built on negatives is exactly where a reader who flips one negative understands the opposite of the truth |
| Pictures-only or low-literacy reader | Tests whether the graphics carry the claim alone |

### Specialists
| Lens | Brief |
|---|---|
| Terminology | One name per thing, one thing per name, and every term glossed at first use |
| Depth consistency | Simpler levels against the careful level, passage by passage |
| Honesty | The house rules above, **and** whether the hedging has become so heavy that it undercuts a finding the work has earned |
| Accessibility | Against the real source and scripts |
| Defects | Against the real page, driven in a browser. **Must also test with JavaScript disabled.** For three rounds running, the no-JavaScript path had faults no other reader could see |
| Structure | Order, transitions, and topics raised and then dropped |
| Repetition and tells | Repeated constructions, caveats stated more often than a reader needs, and prose that reads as generated |
| **Cost to the reader** | What the page costs to keep open in idle CPU, memory, battery and data. Must measure against a control page and report numbers. **Added after six rounds in which nobody asked, while the page used 26 points of idle CPU** |

### Adversaries
| Persona | The claim they test |
|---|---|
| Recall test | That the structure survives one read. The reader reproduces the argument from memory, without looking back |
| Ninety-second skimmer | That a fast reader does not leave with something **false** |
| The author of the source work | That the page read the work with attention and did not oversell it |
| Would-you-share | That it reads as made with care rather than generated |
| **A/B against an earlier draft** | That the rounds are improving the page and not only making it more cautious. The drafts are unlabelled, and both orderings run. **The only reader that can detect regression** |
| Fix auditor | That last round's fixes actually reached a reader |
| Disposition auditor | That the author triaged last round's findings fairly |

### Retired
| Persona | Rounds run | Why retired |
|---|---|---|
| Spelling | 3 | Every finding was an extraction artifact |
| Number consistency | 3 | Clean, and the terminology lens catches what it would catch |
| Mobile geometry | 3 to 4 | The defect reader, driving a real browser, now covers it |
| "Find the friction" framings | 1 to 2 | Replaced by goal framing, as SKILL.md explains |

## Out of scope

- The quality of the underlying work. Readers judge the page, not the study.
- Whether the page should have answered a genuine open scientific question. A reader must distinguish *"the page forgot"* from *"nobody knows, and the page says so."* Make them label which.
- Invented facts about the source. If a reader cannot support a claim from the materials, it is not a finding.
