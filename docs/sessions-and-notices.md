# Sessions and notices

Build spec for the changes that let two agents share this office. Written down
because a decision stored in a conversation is a decision nobody can find later.

Context: the office was designed for one agent at a time. Exactly one thing
assumed that — a single global session row. Everything else (the append-only
log, declared identity, "unattributed rather than guessed") was already
multi-agent-shaped. This is what replaces that one assumption.

## The bug being fixed

`office begin` wrote a single row (`session_state WHERE id = 1`) holding the
active project and author for the whole machine. Two consequences, both real
and both observed:

- The second agent to run `begin` silently inherited the first agent's
  identity. Work it opened was recorded as authored by the other agent.
- Had that agent instead run `begin --by <its own name>`, it would have
  overwritten the first agent's row and every later unattributed write by the
  first agent would have been attributed to the second.

Root cause of the collision itself is a documentation bug: `AGENTS.md` taught
`office begin --project ~/Projects/the-thing --by freebuff` — the product's own
name as the example. `--by` was optional and remembered, so every agent
following the doc claimed the same name.

The failure is self-concealing: the agent whose attribution happens to be
correct is the only agent with no reason to look.

## What changes

### 1. One session row per author, not per machine

```sql
CREATE TABLE session_state (
  author TEXT PRIMARY KEY NOT NULL,  -- '' is the unnamed slot
  project TEXT,
  updated_at TEXT NOT NULL
);
```

`updated_at` is when that author last ran `begin` — the check-in time, used for
both the activity signal and the notice watermark.

Migration: if the table still has an `id` column, recreate it and move the one
row across, keyed by its author or by `''` if it never named one.

`''` (an unnamed session) is a real slot, not a null. A session that never
declared an author is not the same as an author who declared nothing.

### 2. Resolution: use the remembered session only when it is unambiguous

Where project and author come from, in order:

1. what this call declared (`--project`, `--by`, `OFFICE_PROJECT`,
   `OFFICE_AUTHOR`)
2. the remembered session — **only if it is yours (you declared the author and
   a row exists for it), or you are the unnamed slot, or the machine has
   exactly one row**
3. nothing. Null, not a guess.

`author_source` gains a fourth value, `ambiguous`: more than one *named*
session is recorded and this call declared no author. In that case the author
is null and writes are stored unattributed. This is deliberate — the office's
rule is *nothing is inferred*, and writing a guess into the database is
inference made permanent. A wrong attribution is worse than no attribution,
because it is the thing that fooled us.

The unnamed slot is the exception, and it is load-bearing. A caller that named
nobody is not *ambiguous* — it is unsigned, and the slot it belongs to is not a
person. So it never makes the office ambiguous and never answers with an
author; it can only hand back an anonymous project. The amendment at the end of
this document is why that distinction is not cosmetic.

### 3. `--by` is expected, and says so

`begin` does **not** refuse a session that declines to name itself; the office
is not worth breaking over a flag. It warns, to stderr, with a message that
matches the case:

- declared: silence.
- one remembered session: *no `--by` declared; using the remembered session
  `X`. A future release will require `--by` (or `OFFICE_AUTHOR`).*
- the unnamed slot: *no `--by` declared; you are in the unnamed slot, so
  nothing is attributed to you. If another agent is using this office you are
  sharing that slot — pass `--by <agent>` or export `OFFICE_AUTHOR`.*
- ambiguous: *more than one session is recorded and this one named no author —
  this call inherits nothing and its writes stay unattributed rather than
  guessed. Pass `--by <agent>` or export `OFFICE_AUTHOR`.*
- nothing at all: *no `--by` declared and no session recorded — writes will be
  stored unattributed.*

### 4. `begin` volunteers, it does not wait to be asked

`begin` returns two new things.

**`sessions`** — every recorded session, newest first, each with `author`,
`project`, `since` and `is_you`. This is the activity signal, derived from real
state rather than from a convention: *another session last checked in 22
minutes ago as `opencode`.* No threshold decides whether it is shown; the
timestamps speak.

**`notices`** — work-trail events written by someone else since *your* previous
`begin`. The watermark is your own row's `previous.updated_at`, read before the
row is updated.

Two consequences worth stating plainly:

- **This rides on §1.** "What happened since you were last here" has no
  meaning until "you" is a row. The notice surface is not a feature sitting
  next to per-author identity; it depends on it.
- **The first `begin` for an author has no watermark**, so `notices` is empty
  and says so, rather than dumping the whole trail. A first visit gets the
  briefing, which is the read.

The cursor is a *watermark* (when you last ran `begin`), not read-flags on
notes. Nothing is consumed, nothing new is stored per note, and re-reading is
free.

### 5. Note authors are already stored and get surfaced

`work_events.author` has always been written and never read back:
`ITEMS_SQL` selects the last note's `text` and drops its `author`. That
projection is exactly why a misattributed work item stayed invisible — the note
that said who wrote it *was signed*, and the signature was thrown away before
anyone saw it.

`WorkItem` gains `last_note_author`, and the work listing shows it. This is a
query change, not a schema change.

## Explicitly not in this change

- **Directed notes (`--to`) and an inbox.** Deferred for sequencing, not for
  shape: with two agents on one project, "everything since your last visit"
  already *is* "addressed to you". An addressee is a nullable column any day;
  the watermark above is the piece that needed the row to exist first. When it
  lands it gets a real column, never a name parsed out of note prose — an
  addressee is an identity, and identities here are declared, not parsed.
- **Session tokens.** They answer a question nobody has asked: two sessions by
  the *same* author. They also relocate the convention dependency rather than
  removing it, since a token still has to be passed.
- **`continued_from` links.** Resume is a read, not a restore. A stable name
  plus signed notes plus unfinished work is enough for a fresh session to find
  its own desk. In a real office you don't file a form saying today's Alice
  continues yesterday's Alice; the name carries.
- **Colours or per-session labels.** Dropped by decision.
- **A repair path for past misattribution.** The log stays frozen; a correction
  is a new entry, which is what the log is for.

## Amendment: the unnamed slot must not close the door

Recorded after the review of this build, because the first version of §2 turned
an omission into a one-way door.

The original rule was "more than one session recorded and no author declared →
`ambiguous`", counting *every* row including the unnamed slot. Two consequences
followed that this spec did not intend:

- `beginSession` writes a declared project even when the caller named nobody,
  into the unnamed slot. So a single `office begin --project <path>` on a
  machine that already had one named session created a second row, and from
  then on every undeclared command on that machine resolved to *nothing* —
  permanently, because nothing deletes a session row. One machine, one human,
  one forgotten flag, and the office stops resolving a project for good.
- The collateral was wider than "writes are unattributed". Project and author
  were resolved together, so losing the author also dropped the project, and a
  bare `office work` widened from one project to the whole store.

Both follow from treating the unnamed slot as if it were a person. It is not: it
is where work without a name goes. The rules are now:

- An undeclared caller belongs to the unnamed slot if it exists, holding the
  project that caller last declared, with a null author and a warning.
- Ambiguity requires two or more *named* sessions and no name declared. That is
  the case where the office genuinely cannot tell which person you are, and it
  still inherits nothing and says so.

Two smaller repairs came with it:

- `setActive` now writes only what the call declared. A field left out is
  *kept*, which removes the "`begin --by X` clears X's remembered project"
  item that used to sit in *Known, not fixed*.
- The watermark a `begin` reports is the caller's own row (the author's row, or
  the unnamed slot) rather than whichever session the machine resolved. A
  declared author can no longer be handed the other agent's history as "what
  happened since you were last here".

`beginSession` also honours `OFFICE_PROJECT`/`OFFICE_AUTHOR` directly now. That
only matters to a caller talking to the daemon without the CLI in front of it —
the CLI already folded both into the request body.

## Known, not fixed here

- **The unnamed slot is shared.** Two agents that both decline to name
  themselves are indistinguishable and land in the same slot, so the second
  overwrites the first's project. No schema fixes this: telling two unsigned
  callers apart requires an identity nobody declared, and inferring one from a
  PID or a worktree is against the rule. It is closed by declaring a name, and
  `begin` now says exactly that.
- **The unnamed slot cannot be removed.** At most one exists, it is only ever
  created by a caller that named nobody, and it never makes the office
  ambiguous — so leaving it is untidy rather than harmful. A later change may
  want a way to clear it.
- **The board is not a fixture.** A notice board that lives at a path and is
  found through a memory is still knowledge pretending to be a place. The
  mechanism this spec adds (`begin` volunteering things) is where it should
  eventually live, as one more notice kind.
