# Sessions and notices

This is the build spec for the changes that let two agents share this office. It is written down because nobody can find a decision later if it only exists in a conversation.

> **Read the amendments last-first.** This document is a history, and later amendments replace earlier sections. Since 27 Oct 2026 there is **no unnamed slot and no remembered project**. A caller with no name has no session, and the office decides nothing from a session's memory, as the last amendment explains. The sections that describe either one stay as the record of why, not as how the office works now.

The office began as a design for one agent at a time. Exactly one thing assumed that, a single global session row. Everything else was already built for several agents, including the append-only log, declared identity and the rule of "unattributed rather than guessed". This document replaces that one assumption.

## The bug being fixed

`office begin` wrote a single row, `session_state WHERE id = 1`, that held the active project and author for the whole machine. That had two consequences, and both happened in practice.

- The second agent to run `begin` silently inherited the first agent's identity. The office recorded the work it opened as authored by the other agent.
- If that agent had instead run `begin --by <its own name>`, it would have overwritten the first agent's row. The office would then have attributed every later unattributed write by the first agent to the second.

The collision itself started with a documentation bug. `AGENTS.md` taught `office begin --project ~/Projects/the-thing --by freebuff`, with the product's own name as the example. `--by` was optional and remembered, so every agent that followed the doc claimed the same name.

The failure hides itself. The agent whose attribution happens to be correct is the only agent with no reason to look.

## What changes

### 1. One session row per author, not per machine

```sql
CREATE TABLE session_state (
  author TEXT PRIMARY KEY NOT NULL,  -- '' is the unnamed slot
  project TEXT,
  updated_at TEXT NOT NULL
);
```

`updated_at` is when that author last ran `begin`. It is the check-in time, and the office uses it for both the activity signal and the notice watermark.

If the table still has an `id` column, the migration recreates the table and moves the one row across. It keys the row by its author, or by `''` if it never named one.

The unnamed session, `''`, is a real slot, not a null. A session that never declared an author is not the same as an author who declared nothing.

### 2. Resolution uses the remembered session only when it is unambiguous

The office takes project and author from these sources, in order.

1. What this call declared with `--project`, `--by`, `OFFICE_PROJECT` or `OFFICE_AUTHOR`.
2. The remembered session, but **only if it is yours, if you are the unnamed slot, or if the machine has exactly one row**. It is yours when you declared the author and a row exists for it.
3. Nothing. The answer is null, not a guess.

`author_source` gains a fourth value, `ambiguous`. It applies when the office has more than one *named* session recorded and this call declared no author. The author is then null, and the office stores the call's writes unattributed. This is deliberate. The office's rule is that *nothing is inferred*, and writing a guess into the database makes the inference permanent. A wrong attribution is worse than none, because a wrong attribution is what fooled us.

The unnamed slot is the exception, and the design depends on it. A caller that named nobody is not *ambiguous*. It is unsigned, and the slot it belongs to is not a person. So the slot never makes the office ambiguous and never answers with an author. It can only hand back an anonymous project. The amendment at the end of this document explains why that distinction matters.

### 3. `--by` is expected, and the office says so

`begin` does **not** refuse a session that declines to name itself, because a missing flag is not worth breaking the office over. Instead it writes a warning to stderr that matches the case. The messages below are quoted as the office printed them.

- declared: no warning.
- one remembered session: *no `--by` declared; using the remembered session `X`. A future release will require `--by` (or `OFFICE_AUTHOR`).*
- the unnamed slot: *no `--by` declared; you are in the unnamed slot, so nothing is attributed to you. If another agent is using this office you are sharing that slot — pass `--by <agent>` or export `OFFICE_AUTHOR`.*
- ambiguous: *more than one session is recorded and this one named no author — this call inherits nothing and its writes stay unattributed rather than guessed. Pass `--by <agent>` or export `OFFICE_AUTHOR`.*
- nothing at all: *no `--by` declared and no session recorded — writes will be stored unattributed.*

### 4. `begin` reports without being asked

`begin` returns two new things.

**`sessions`** lists every recorded session, newest first, each with `author`, `project`, `since` and `is_you`. This is the activity signal, and it comes from real state rather than from a convention. For example, *another session last checked in 22 minutes ago as `opencode`.* No threshold decides whether a session is shown. The reader judges from the timestamps.

**`notices`** lists work-trail events that someone else wrote since *your* previous `begin`. The watermark is your own row's `previous.updated_at`, which the office reads before it updates the row.

Two consequences need saying plainly.

- **This depends on §1.** "What happened since you were last here" means nothing until "you" is a row. Notices are not a separate feature next to per-author identity. They depend on it.
- **The first `begin` for an author has no watermark**, so `notices` is empty and says so, instead of returning the whole trail. A first visit gets the briefing, which is the read it needs.

The cursor is a *watermark*, meaning the time you last ran `begin`. It is not a set of read flags on notes. Nothing is consumed, the office stores nothing new per note, and re-reading costs nothing.

### 5. The office already stores note authors, and now shows them

The office has always written `work_events.author` and never read it back. `ITEMS_SQL` selects the last note's `text` and drops its `author`. That query is exactly why a misattributed work item stayed invisible. The note that said who wrote it *was signed*, and the query threw the signature away before anyone saw it.

`WorkItem` gains `last_note_author`, and the work listing shows it. This changes a query, not the schema.

## Explicitly not in this change

- **Directed notes with `--to`, and an inbox.** These wait for sequencing, not for design. With two agents on one project, "everything since your last visit" already *is* "addressed to you". An addressee is a nullable column that can be added any day. The watermark above needed the row to exist first. When addressees arrive they get a real column, never a name parsed out of note prose. An addressee is an identity, and agents declare identities. The office never parses them.
- **Session tokens.** They answer a question nobody has asked, which is two sessions by the *same* author. They also move the dependency on convention instead of removing it, since an agent still has to pass the token.
- **`continued_from` links.** Resuming is a read, not a restore. A stable name, signed notes and the unfinished work are enough for a fresh session to find its own work. In a real office nobody files a form saying today's Alice continues yesterday's Alice. The name is enough.
- **Colours or per-session labels.** These were dropped by decision.
- **A repair path for past misattribution.** The log stays frozen. A correction is a new entry, which is what the log is for.

## Amendment: the unnamed slot must not stop project resolution

Recorded after the review of this build. Under the first version of §2, one forgotten flag could stop the office resolving a project for good.

The original rule said that more than one recorded session and no declared author gives `ambiguous`. It counted *every* row, including the unnamed slot. Two consequences followed that this spec did not intend.

- `beginSession` writes a declared project into the unnamed slot even when the caller named nobody. So a single `office begin --project <path>` on a machine that already had one named session created a second row. From then on, every undeclared command on that machine resolved to *nothing*. That was permanent, because nothing deletes a session row. One machine, one human and one forgotten flag were enough to stop the office resolving a project for good.
- The damage went beyond unattributed writes. The office resolved project and author together, so losing the author also dropped the project, and a bare `office work` widened from one project to the whole store.

Both follow from treating the unnamed slot as if it were a person. It is not. It is where work without a name goes. The rules are now these.

- An undeclared caller belongs to the unnamed slot if the slot exists. The slot holds the project that caller last declared, with a null author and a warning. That project then scopes reads like any other. With no project at all, reads return only the everywhere notes, as the retrieval rule says.
- Ambiguity requires two or more *named* sessions and no declared name. In that case the office truly cannot tell which person you are, so it still inherits nothing and says so.

Two smaller repairs came with it.

- `setActive` now writes only what the call declared, and keeps any field the call left out. That removes the item "`begin --by X` clears X's remembered project", which used to be listed under *Known, not fixed*.
- The watermark a `begin` reports now comes from the caller's own row, which is the author's row or the unnamed slot. It used to come from whichever session the machine resolved. So the office can no longer hand a declared author the other agent's history as "what happened since you were last here".

`beginSession` used to read `OFFICE_PROJECT` and `OFFICE_AUTHOR` directly. That fallback was removed on `2026-09-30`, because it ran *inside the daemon*. The daemon is a long-lived shared process, so its environment belongs to whoever started it, not to the caller. A daemon started with `OFFICE_AUTHOR=probe` signed every unnamed write on the machine with that name and reported it as `declared`. That is exactly the silent misattribution the rules above exist to prevent. Environment fallbacks now live in the caller. The CLI adds its own `OFFICE_*` values to the request body, and a caller that reaches the daemon directly must put its name and project there too.

## Known, not fixed here

- **The unnamed slot is shared.** Two agents that both decline to name themselves look the same and land in the same slot, so the second overwrites the first one's project. No schema fixes this. Telling two unsigned callers apart needs an identity nobody declared, and inferring one from a PID or a worktree breaks the rule. Declaring a name solves it, and `begin` now says exactly that.
- **The unnamed slot cannot be removed.** At most one exists. Only a caller that named nobody creates it, and it never makes the office ambiguous. So leaving it is untidy but harmless. A later change may add a way to clear it.
- **The notice board is not built in.** A notice board kept as a file, which agents find through a memory, is just another note. It should eventually become one more kind of notice, delivered by the mechanism this spec adds, where `begin` reports things without being asked.

## Amendment: an author is never inherited

Recorded 2026-09-23, after this happened in real use. It replaces §2 rule 2 **for the author half only**, and the first bullet of §3's warning list.

§2 let a caller that named nobody fall back to the machine's only row. That convenience is right with one agent and wrong as soon as there are two. Whichever agent happens to be alone in the office silently signs its work with the other agent's name. That is why this store holds no work under `opencode`. An OpenCode session ran with no `--by`, resolved to the one remembered row and inherited `freebuff`. Its own reasoning, recovered from OpenCode's logs, was *"I inherited `freebuff`, it happened to be right, and so I never looked."*

Those logs also show the other half of the problem, and it is not a behaviour bug. `AGENTS.md` tells a read-only agent to start with `office begin`, and the agent correctly refuses. `begin` writes a session row and advances a watermark, so it is not a read. The first command an agent runs changes state, so the most careful agents are the ones that cannot get in. This amendment leaves open whether to offer a read-only way in that does not move the watermark.

The rule is now narrower than "unambiguous". **`resolveScope` resolves an author only from what the call declared.** With no declaration the author is null, whatever the machine remembers. The writes are unattributed and visibly so, which is the rule the rest of the office already follows.

- The office still inherits the **project** as before, from the unnamed slot or the machine's only row. A project is not an identity, and a wrong one shows in the record.
- `author_source: "active"` now means *the office remembers a session, and your work still does not go under it*. The warning says exactly that, and no longer reports the remembered name as though it were yours.
- The office no longer counts anonymous writes as "yours" when it builds `notices`. With no declared name, there is no signature to compare a note's signature against. A caller that wants "since you were last here" to mean something has to declare who it is.
- The single-agent convenience moves to the launcher, where each agent knows its own name. Export `OFFICE_AUTHOR` **per agent**. An agent cannot reliably work out its own product name, which is why one of them copied the literal `--by freebuff` from this project's own examples.

## Amendment: a read-only way in

Recorded 2026-09-24. It answers the question the previous amendment left open on purpose, and closes work item #6.

That amendment ended by naming a problem it did not fix. `begin` is the first command an agent runs, and it changes state. So the office turns away exactly the agents most likely to respect a read-only instruction. This happened. The same OpenCode session whose inheritance bug prompted this document read `AGENTS.md`, considered `begin`, and correctly refused it. Its reasoning was *"a command likely may write session/log, non-readonly prohibited. We cannot."* The refusal was correct and silent, so the office could not tell that a careful agent had ever arrived.

**Decision.** `begin` gains `--readonly`, and `office peek` runs the same call as a command. Both return the whole briefing and write nothing. `peek` exists because the agent that needs it is the agent least likely to discover a flag. A command whose name says it changes nothing is an honest signal, and the instruction file points to it.

A read-only visit does these things, and no others.

- It resolves scope exactly as `begin` would, with the same project and the same author rules. But it calls `peekSession` instead of `beginSession`. `peekSession` reads the caller's own row and writes nothing. It creates no session for a newcomer, replaces no project and moves no check-in mark.
- It still reports notices. That changes the earlier sketch, which proposed leaving them out. It can report them because the office *reads the watermark from the caller's own row and then advances it with the write*. Without the write, the read still works. So "since you were last here" stays true of the moment it names. The response carries the caveat as `readonly_note`. It says nothing was written, the check-in time did not move, and the same notices will appear again until a real `begin` moves the mark. A caller with no earlier row is told instead that it has no check-in to measure against.
- It is **not** a check-in, and the response says so with `readonly: true` instead of quietly counting as one. A peek must not be able to silence a notice by reading it. That would make the watermark something reads use up, which this document has rejected from the start.

The rule for reasoning about this has not changed, and a cautious agent needs to hear it again. A read is a read no matter which HTTP verb the CLI uses. `context` and `search` are `POST`s and write nothing. The same holds for `work` and `tools`, and now for `peek`. Only `begin`, `remember`, `forget`, `work open|note|close` and `tools add|remove` change the record. `AGENTS.md` states this plainly, so an agent does not have to infer it from traffic it cannot see.

The rule does not cover one thing. The CLI starts the local daemon if it is not running, which writes a pid file and a log. That is machine setup, not the office record, and nothing in the database changes. But an agent whose instruction is broader than "do not modify *the store*" will still notice it. The rule honestly covers only the record, and the doc says so.

This amendment does not add a *persistent* read-only identity, or a peek that can mark work acknowledged without checking in. Both would bring back the write this amendment exists to remove.

## Amendment: a fresh agent gets recent activity

Recorded 2026-09-30. It replaces §4's rule that a session with no watermark gets empty `notices`.

That rule assumed an agent comes back to the same office. In practice a session here rarely survives, and often it should not. A fresh agent *always* has no watermark. So the one part of the briefing that says another agent has been here was blank for exactly the agents that need it most. An empty answer is honest only when nobody asked a question. Every arriving agent asks what has been going on here. Answering with nothing sends the agent searching the machine for changes it does not remember making.

So the answer now depends on whether the caller has checked in before.

- **With a watermark**, meaning the caller has checked in before, `notices` works exactly as §4 describes. It lists events since *your* previous `begin`, minus your own work.
- **Without one**, on a first visit or for any caller that has never checked in, `notices` lists the project's most recent activity, up to `BRIEFING_NOTICES` events. With no project declared it is empty. Frank changed that on 2026-10-27, because the briefing never carries another project's details. It used to list the whole office's activity, with each event labelled by project. For the same reason, the session list shows only this project's sessions.

The response states which case applies, so nobody has to infer it. `notices_since` stays null when there is no personal watermark, and `notices_note` carries `RECENT_ACTIVITY_NOTE`. The read-only caveat from the previous amendment still holds, and on a first visit it reads differently. A peek with no watermark re-reads the same recent list every time, because there is no mark to move.

One more change came with this, because it fixes the same misreading of a fresh session. `SessionSummary` gains `last_seen`, the check-in time in plain words. `since` is the fact, but a bare timestamp gives an agent no way to tell a colleague who is here from one that stopped a week ago. No threshold decides this. The office reports the age and lets the reader judge, which is the rule §4 already applies to `since`.

## Amendment: the work read is scoped, and the unclaimed read finds orphaned work

Recorded 2026-09-30. It replaces the second bullet of the amendment *the unnamed slot must not stop project resolution*, which recorded the widening as a symptom instead of fixing it.

`listWork` took an optional project, and no project meant **no filter**. A bare `office work` returned every project's unfinished work. That is the read the scope rule exists to refuse, because it hands over another project's loose ends as if they were the reader's. The earlier amendment saw this happen while fixing a different bug, and left it alone.

The scope is now a required argument, `WorkRead`, with three options. A caller cannot choose one by leaving the argument out.

- `{ kind: "project", project }` returns this project's unfinished work. This is the handover.
- `{ kind: "unclaimed" }` returns work filed with no project at all.
- `{ kind: "all" }` returns the whole trail. This is the human's read, like `office list`.

With no project declared, `office work` reads the **unclaimed** set instead of everything, and `UNCLAIMED_WORK_NOTE` says so in the response. That is not a guess. An item with no project belongs to nobody, so showing it cannot hand anyone the wrong work. It is also the only way anyone will find a handoff that lost its project. `office work log` asks for `all` by name.

This closes the case the earlier amendment opened. The live store held four work items with no project, including the two most detailed audit notes in the store, and none of them showed up in the project they belonged to. A missing name is now a visible gap instead of a silent loss.

- **When an agent writes.** `POST /work/open` and `POST /remember` report `unclaimed` or `unattributed` and carry a note. The CLI writes that note to stderr, where the agent can still fix the problem at no cost. The office refuses nothing. A hard stop is a burden, and agents work around burdens.
- **When an agent reads.** The briefing gives a session with no project the unclaimed work, with `open_work_note` explaining why. `store.unattributed` now counts work as well as memories, because the number of unattributed records was never a question about memories alone.

## Amendment, 26 Oct 2026: the folder is the project

Agents no longer start in the office checkout and get told where to go. They start inside the project they work on, which `office init` sets up, with one agent per repository. So the order for resolving the **project** gains a step, and it sits above anything remembered.

1. What this call declared with `--project` or `OFFICE_PROJECT`.
2. **The repository the command runs in**, which the CLI sends as `cwd_project`. The office reports it as `project_source: "folder"`.
3. The remembered session, under the same rules as before.
4. Nothing.

The order for the author is unchanged. The office only ever takes an author from a declaration.

The folder gives no project in the agent-office checkout itself, so that the office is never mistaken for a target. It also gives none in a folder outside any repository, or in a repository rooted at the home folder. Those are the only places where a remembered project still decides.

Two things keep this from becoming a new way to misfile. First, `begin` stores a folder project only on a *named* session's row. The unnamed slot changes only on an explicit `--project`, so one nameless agent's folder never becomes every other nameless agent's project. Second, when the folder gives a different project from the one a named session began on, every scoped response carries a `scope_note` and the CLI prints it. An agent that has wandered into another repository should hear about it at the moment it writes. Gemini made this change, and it was reviewed and fixed on 26 Oct 2026 as office work item #105.

## Amendment, 27 Oct 2026: nothing is decided from memory

Frank decided three things. A name is a signature that says which provider and which run, not a way to coordinate agents. The agent-office checkout is an ordinary project. And the office never decides a project from a session's memory. A command's project is its `--project` or `OFFICE_PROJECT`, else the repository it runs in, else none. Its author is what it declared, else none.

Those decisions removed the safeguards that the remembered project needed.

- The unnamed slot. A caller with no name now has no session row, and the office tells it that its writes are unsigned.
- The rule that two named sessions and no declared name give no answer.
- Two of the three author warnings.

A session row now only records where an agent last checked in and when. The office uses it for the watermark, the session list and the note that tells an agent it has wandered into another repository. A named `begin` records where it checked in this time, even when that is no project at all. The change added two notes. One points out a bare name with no check-in behind it. The other appears when a `begin` names a project in a folder that is not a repository, and says later commands need the name too. The accepted cost is that a folder that is not a git repository gives no project. The plan, critic and blind solver were in review-loop/naming/, which the cleanup removed. Read them with `git show b552f6a:review-loop/naming/PLAN.md`.

## Amendment, 27 Oct 2026: no office manager

The manager role existed so that one agent knew for certain it was working on agent-office and not another project. Starting agents inside their repository now does that, as Frank noted. The change removed `--role`, `OFFICE_ROLE` and the manager lines in the briefing. The office refuses a launcher that still passes a role, with a message, instead of ignoring it. Existing stores keep the `role` column, and nothing reads it. Issues stay. An agent working in the agent-office repository handles them, as `AGENTS.md` says.

## Amendment, 27 Oct 2026: one rule for unusual repositories, and keys renamed once

These are Frank's decisions. One rule finds a folder's project. When git's shared folder is a `.git` folder, the project is the folder that holds it, which is the main checkout from any worktree. Otherwise the project is the checkout you are in. The special handling for bare repositories, git folders kept elsewhere and submodules inside worktrees is gone. None of these is used here, and a bare repository's worktrees are now separate projects, which Frank accepted. A bare name such as `crokinole` means the folder of that name beside the office checkout, when it exists. That is `~/Projects` here and `~/Dev` on the laptop, and `OFFICE_PROJECTS_DIR` overrides it.

Reads now match a project key exactly, instead of re-examining every key ever stored on each read. The daemon rewrites old spellings once, when it starts. Old spellings are plain names from before keys were folders, and subfolders of a repository. The code is in `src/rekey.ts`. A marker row in `meta` records the rewrite, and later starts only retry plain names. On this machine the rewrite renamed 5 keys and left none unmapped. The plan, critic and blind solver were in review-loop/layouts/, which the cleanup removed. They are in git at b552f6a.

## Amendment, 27 Oct 2026: moved and removed projects

Frank left the choices to the author's recommendations. The author withdrew the first recommendation, carrying notes over automatically, after the peer review step. A copy of a deleted original, repositories made from one template and unplugged drives all looked like moves, and every fix made the plan bigger. What was built is this. A check-in records its repository's fingerprint, which is its sorted root commits. An empty repository or a shallow clone has none, and the next check-in tries again. When a fresh folder shares history with a known project whose folder is gone, the agent gets a note telling it to ask the human. `office move <old path>` brings the notes over, and refuses on a copy, a merge or a different history. `office status` lists projects whose folder is not found, and nothing is deleted. The plan, critics and blind solver were in review-loop/moved-projects/, which the cleanup removed. They are in git at b552f6a.
