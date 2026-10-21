# Profile: explainer-public

A public page explaining one piece of technical or scientific work to people who
do not have the training to read the source. Written from six rounds on one such
page; the cast and the house rules are what that work settled on.

---

## Success question

> A reader who knows nothing about the field should finish able to say, in their
> own words, **both what the work showed and what it did not show.**

The second half is the unusual part and it is what this kind of page is for.
Almost all public science writing delivers the first half and omits the second.

## House rules the artifact must obey

Each has a test, so a reader can check compliance rather than offer an opinion.

1. **A non-detection is never written as an equality.** "No difference was
   detected" is not "there was no difference." *Test: find a sentence that
   states a negative result; does another part of the page hedge the same result
   more carefully?*
2. **An association is never written as a cause.**
3. **The caveat belongs inside the sentence that makes the claim, not after it.**
   A claim plus a paragraph of limitations is a claim plus a retraction, and a
   reader keeps only the claim.
4. **The simple version may compress but may never claim more than the careful
   version.** *Test: read all reading levels of the same passage side by side.*
5. **A term is glossed where it first appears.**
6. **The page keeps the promises it makes about itself** — naming conventions it
   states, cross-references it offers, questions it raises. *Test: find every
   sentence of the form "X comes later" and check that X arrives.*

Rule 6 produced the best finding of round 4 and the best of round 3. It is the
cheapest rule to check and the one most likely to be broken, because promises
are made early and kept late, by which time the author has moved on.

## Materials bundle

- **Comprehension readers:** the rendered page as an ordered screenshot series,
  plus a text extract in reading order at their reading level.
- **Specialists:** whatever their lens needs. Accessibility and defect readers
  get the **real source and the real scripts**, and must be told which attributes
  are set at runtime rather than present in the markup.
- **Depth-consistency reader:** all reading levels as separate complete passes.
- Note in every brief: animations are captured at their finished state on
  purpose; that is not a fault.

## Cast

**A starting cast, not a fixed one** (see SKILL.md). The readers that earned the
most were invented for a particular round and are not in this table.

### Comprehension readers
| Persona | Why they are in the cast |
|---|---|
| Curious adult, no training | The target reader |
| Eleven-year-old | Tests the simplest level; catches unexplained words fastest |
| Domain specialist who did not do the work | The only reader who can catch a misstatement |
| Non-native English reader, ~B2 | **Best value in round 4.** A page built on negatives is exactly where a reader who flips one understands the opposite of the truth |
| Pictures-only / low literacy | Tests whether the graphics carry the claim alone |

### Specialists
| Lens | Brief |
|---|---|
| Terminology | One name per thing; one thing per name; glossed at first use |
| Depth consistency | Simpler levels against the careful level, passage by passage |
| Honesty | The house rules above — **and** whether the hedging has become so heavy it undercuts a finding the work has earned |
| Accessibility | Against the real source and scripts |
| Defects | Against the real page, driven in a browser. **Must also test with JavaScript disabled** — three rounds running, the no-JS path carried faults no other reader could see |
| Structure | Order, seams, threads raised and dropped |
| Repetition and tells | Repeated constructions, caveats stated more often than a reader needs, prose that reads as generated |
| **Cost to the reader** | *Standing reader (SKILL.md).* For this genre: what the page costs to have open — idle CPU, memory, battery, data — measured in a real browser against a control page, reported as numbers |

### Adversaries
| Persona | The claim they test |
|---|---|
| Recall test | That the structure survives one read — reproduce the argument from memory, no looking back |
| Ninety-second skimmer | That a fast reader does not leave with something **false** |
| The author of the source work | That the page read the work with attention and did not oversell it |
| Would-you-share | That it reads as made with care rather than generated |


Plus the four **standing readers** from SKILL.md — fix auditor, disposition
auditor, cost reader, A/B reader — from round two onward.

### Retired
| Persona | Rounds run | Why retired |
|---|---|---|
| Spelling | 3 | Every finding was an extraction artifact |
| Number consistency | 3 | Clean; the terminology lens catches what it would |
| Mobile geometry | 3–4 | Subsumed by the defect reader driving a real browser |
| "Find the friction" framings | 1–2 | Superseded by goal framing (see SKILL.md) |

## Out of scope

- The quality of the underlying work. Readers judge the page, not the study.
- Whether a genuine open scientific question should have been answered. A reader
  must distinguish *"the page forgot"* from *"nobody knows, and the page says
  so."* Make them label which.
- Invented facts about the source. If a reader cannot support a claim from the
  materials, it is not a finding.
