---
name: voice-brief
description: Define and confirm the writing voice (who is speaking, to whom, for what, in what tone) with the human before writing any copy where the writing is the deliverable — a README, manual, blog post, landing page, story, long proposal. Skip it for commit messages, code comments, chat replies and short notes.
---

# Voice brief

Before writing anything where the words are the product, settle **who is
speaking, to whom, for what, and how it should sound** — and get the human to
confirm it. A focused definition produces better writing than any amount of
revising a draft that was aimed at nobody in particular.

**Nothing gets written until the human has confirmed the brief.** Not a
draft, not "a first pass to react to". The brief and its sample paragraph are
the thing they react to.

## When to use it

**The test: is the writing the deliverable?** If someone will read this text
for its own sake, or judge the work by it, use this skill.

- **Yes:** README, manual or guide, blog post, newsletter, landing page,
  documentation site, release announcement, proposal or report, story or novel,
  speech, a long email to people who matter.
- **No:** commit messages, code comments, chat replies, tickets, short internal
  notes: text nobody will judge the work by.

Unsure? It takes the human under a minute to confirm a brief. Ask.

## Step 1 — Look for a voice that already exists

Check in this order and stop at the first that applies:

1. **A brief in the project.** Usually `docs/VOICE.md`; also look for
   `VOICE.md` at the root or a brief named after the document. If one covers
   this piece, show it to the human in one line ("Using the project voice:
   <writer> to <audience>, <tone>. Still right?") and go to step 5 once they
   say yes.
2. **A saved voice in [`voices/`](voices/)** that fits (for example the
   human's personal blog voice). Propose it by name.
3. **The document you are editing.** If you are revising or extending a
   document, its voice is already there. Describe it as a brief (step 2) and
   ask whether to keep it, rather than inventing a new one.

Other writing in the project (a README when you are writing release notes,
say) is **evidence** for the draft brief, not a confirmed voice. Use it, and
say in the brief that you did.

## Step 2 — Draft the brief

Use [`template.md`](template.md). **Draft it yourself from everything you
already know** — the project, the conversation, the existing documents, who the
human has said this is for. The human corrects a draft far faster than they
answer a questionnaire. Ask a question only where you genuinely cannot guess.

The parts, and what makes each one work:

- **Writer.** Who is speaking: a person, a team, a product, a character. Their
  expertise, their relationship to the reader, first person or not. "The
  maintainer, a working developer, talking to peers" is a voice; "the
  documentation" is not. Don't guess personal details the writing would
  reveal (gender, age, background, a real name behind a username): leave
  them out or ask.
- **Audience.** Who reads it, what they already know, what they came for, where
  they read it (terminal, phone, printed page), and what they will do next.
  Name the least experienced reader you must not lose.
- **Purpose.** What the reader should know, feel or do afterwards, as one
  sentence. Write it as review-loop's success question (*can they …?*), so it
  can be handed over unchanged.
- **Tone and stance.** As **is / is-not pairs**, never lone adjectives: *plain,
  not clipped*; *confident, not salesy*; *warm, not chummy*. Every voice
  claims to be "friendly and professional"; the second half of the pair is what
  carries information. Add the emotional stance when it matters (excited,
  reassuring, wry, grave).
- **Style rules.** Concrete and checkable: person (*you*, *we*, *I*), typical
  sentence length, jargon policy (and the terms that need a gloss), spelling
  variety, formatting habits, words and phrases to avoid. Write each so a
  reader could go and look, not form an opinion: *no exclamation marks*, not
  *don't be too excited*.
- **Borrowed voice (optional).** To sound like a known writer, name them **and
  spell out the traits being borrowed**: sentence rhythm, humour, vocabulary,
  how they open and close. A bare name is too vague to follow.
- **Scope.** Which documents this brief covers, and which it does not.

### Borrowing someone's voice: the limits

Borrow **traits**, never text. Do not reproduce their sentences, catchphrases
or recognisable passages; do not present the writing as theirs or imply they
wrote, endorsed or approved it. This applies equally to living and historical
writers.

## Step 3 — Write a sample paragraph

Write **one short paragraph on the real subject**, in the voice — the opening
of the actual piece is ideal. This is the most useful part of the brief: the
human reacts to how it sounds, not to a description of how it sounds. If two
plausible voices are in tension, write a sample of each and let them pick.

## Step 4 — Confirm with the human

Show the whole brief and the sample together as plain text in your reply, and
ask in words: confirm it, or say what to change (or, with two samples, which
voice). Then:

- **Adjust and show again** until they confirm. Each round, change the sample
  too — a revised brief with an old sample proves nothing.
- **Do not start writing on a recommended default,** even an obviously good
  one. Confirmation is the point of this skill.
- If no human is reachable (you are a subagent, or running unattended), stop
  at this step and return the brief and sample to whoever started you, marked
  unconfirmed. The same goes when you may not write files: skip step 5 and
  hand the brief back.

## Step 5 — Save it

- **In the project**, as `docs/VOICE.md` unless the project already keeps
  briefs elsewhere. Add the confirmation date. Commit it with the writing, so
  the next agent finds it in step 1.
- **In [`voices/`](voices/)** as well, if the human wants this voice available
  in other projects. Name the file after the voice, not the project
  (`personal-blog.md`, not `my-app.md`), and strip anything project-specific.
- If a session might end before the writing is done, note in the work log that
  a confirmed brief exists and where.

## Step 6 — Write, holding to the brief

Re-read the brief before each section, not just at the start; voices drift
over a long piece, usually toward generic and hedged. When you finish, check
the style rules mechanically where you can (search for the banned words, count
exclamation marks), and say which rules you checked.

Where limits are written as separate blocks (a caveat box, a "what this doesn't
show" paragraph), **the claim must be true without the block.** Delete each
block and reread: a block may add precision, but never rescue an overstatement.

If the writing shows the brief was wrong — the audience turned out more
technical, the tone does not fit the content — **stop and propose a revised
brief** rather than quietly drifting. Revisions are confirmed like the
original.

## Handing off to review-loop

When the piece matters enough for a review round, the brief already holds
three of review-loop's inputs:

| Voice brief | Becomes in [review-loop](../review-loop/SKILL.md) |
|---|---|
| Audience (and the least experienced reader) | The comprehension readers in the cast |
| Purpose | The success question, unchanged |
| Style rules and is-not halves | House rules with a test attached |

Review-loop can check that rules were followed and that strangers understood.
Whether the voice is *right* — whether it sounds like the writer it should — is
tier 3 there: taste, for the human. Say so when you report.
