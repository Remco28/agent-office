---
name: voice-brief
description: Define and confirm the writing voice with the human, meaning who is speaking, to whom, for what and in what tone, before writing any copy where the writing is the deliverable, such as a README, manual, blog post, landing page, story or long proposal. Skip it for commit messages, code comments, chat replies and short notes.
---

# Voice brief

Before writing anything where the words are the product, settle **who is speaking, to whom, for what, and how it should sound**, and get the human to confirm it. A focused definition produces better writing than any amount of revising a draft that was aimed at nobody in particular.

**Write nothing until the human has confirmed the brief.** That includes a draft and "a first pass to react to". The brief and its sample paragraph are what the human reacts to.

## When to use it

**The test is whether the writing is the deliverable.** If someone will read this text for its own sake, or judge the work by it, use this skill.

- **Yes** for a README, a manual or guide, a blog post, a newsletter, a landing page, a documentation site, a release announcement, a proposal or report, a story or novel, a speech, and a long email to people who matter.
- **No** for commit messages, code comments, chat replies, tickets and short internal notes, which is text nobody will judge the work by.

If you are unsure, ask. Confirming a brief takes the human under a minute.

## Step 1: Look for a voice that already exists

Check in this order and stop at the first that applies:

1. **A brief in the project.** It is usually `docs/VOICE.md`. Also look for `VOICE.md` at the root, or for a brief named after the document. If one covers this piece, show it to the human in one line, such as "Using the project voice: <writer> to <audience>, <tone>. Still right?", and go to step 5 once they say yes.
2. **A saved voice in [`voices/`](voices/)** that fits, for example the human's personal blog voice. Propose it by name.
3. **The document you are editing.** If you are revising or extending a document, its voice is already there. Describe it as a brief, as in step 2, and ask whether to keep it, instead of inventing a new one.

Other writing in the project, such as a README when you are writing release notes, is **evidence** for the draft brief, not a confirmed voice. Use it, and say in the brief that you did.

## Step 2: Draft the brief

Use [`template.md`](template.md). **Draft it yourself from everything you already know**: the project, the conversation, the existing documents, and who the human has said this is for. The human corrects a draft far faster than they answer a questionnaire. Ask a question only where you truly cannot guess.

These are the parts, and what makes each one work.

- **Writer.** Say who is speaking, whether a person, a team, a product or a character. Give their expertise, their relationship to the reader, and whether they write in the first person. "The maintainer, a working developer, talking to peers" is a voice, and "the documentation" is not. Don't guess personal details the writing would reveal, such as gender, age, background or a real name behind a username. Leave them out or ask.
- **Audience.** Say who reads it, what they already know, what they came for, where they read it, such as a terminal, a phone or a printed page, and what they will do next. Name the least experienced reader you must not lose.
- **Purpose.** Say in one sentence what the reader should know, feel or do afterwards. Write it as review-loop's success question, *can they …?*, so you can hand it over unchanged.
- **Tone and stance.** Write these as **is / is-not pairs**, never as lone adjectives, for example *plain, not clipped*, *confident, not salesy* and *warm, not chummy*. Every voice claims to be "friendly and professional". The second half of each pair is what carries information. Add the emotional stance when it matters, such as excited, reassuring, wry or grave.
- **Style rules.** Make them concrete and checkable. Cover the person, meaning *you*, *we* or *I*, the typical sentence length, the jargon policy and the terms that need a gloss, the spelling variety, formatting habits, and words and phrases to avoid. Write each so a reader could go and look instead of forming an opinion. Write *no exclamation marks*, not *don't be too excited*.
- **Borrowed voice, if any.** To sound like a known writer, name them **and spell out the traits you are borrowing**: sentence rhythm, humour, vocabulary, and how they open and close. A bare name is too vague to follow.
- **Scope.** Say which documents this brief covers, and which it does not.

### The limits on borrowing someone's voice

Borrow **traits**, never text. Do not reproduce their sentences, catchphrases or recognisable passages. Do not present the writing as theirs, or imply they wrote, endorsed or approved it. This applies equally to living and historical writers.

## Step 3: Write a sample paragraph

Write **one short paragraph on the real subject**, in the voice. The opening of the actual piece is ideal. This is the most useful part of the brief, because the human reacts to how it sounds, not to a description of how it sounds. If two plausible voices pull in different directions, write a sample of each and let the human pick.

## Step 4: Confirm with the human

Show the whole brief and the sample together as plain text in your reply. Ask in words whether they confirm it or what to change, and with two samples, which voice they want. Then:

- **Adjust and show again** until they confirm. Change the sample every round too, because a revised brief with an old sample proves nothing.
- **Do not start writing on a recommended default,** even an obviously good one. Confirmation is the point of this skill.
- If no human is reachable, because you are a subagent or running unattended, stop at this step. Return the brief and sample to whoever started you, marked unconfirmed. Do the same when you may not write files: skip step 5 and hand the brief back.

## Step 5: Save it

- **In the project**, save it as `docs/VOICE.md` unless the project already keeps briefs elsewhere. Add the confirmation date. Commit it with the writing, so the next agent finds it in step 1.
- **In [`voices/`](voices/)** as well, if the human wants this voice available in other projects. Name the file after the voice, not the project, so `personal-blog.md`, not `my-app.md`. Strip anything specific to the project.
- If a session might end before the writing is done, note in the work log that a confirmed brief exists and where it is.

## Step 6: Write, and keep to the brief

Re-read the brief before each section, not just at the start. Over a long piece the voice tends to slide, usually toward generic and hedged writing. When you finish, check the style rules mechanically where you can, for example by searching for the banned words or counting exclamation marks, and say which rules you checked.

Where limits are written as separate blocks, such as a caveat box or a "what this doesn't show" paragraph, **the claim must be true without the block.** Delete each block and reread. A block may add precision, but it must never rescue an overstatement.

If the writing shows the brief was wrong, for example the audience turned out more technical or the tone does not fit the content, **stop and propose a revised brief** instead of quietly drifting from it. The human confirms revisions the same way as the original.

## Handing off to review-loop

When the piece matters enough for a review round, the brief already holds three of review-loop's inputs.

| Voice brief | Becomes in [review-loop](../review-loop/SKILL.md) |
|---|---|
| Audience, including the least experienced reader | The comprehension readers in the cast |
| Purpose | The success question, unchanged |
| Style rules and is-not halves | House rules with a test attached |

Review-loop can check that the writing followed the rules and that strangers understood it. Whether the voice is *right*, meaning whether it sounds like the writer it should, is tier 3 in review-loop. That tier is taste, and it is for the human. Say so when you report.
