I found one concrete compatibility break.

### MEDIUM — `/status.active` stops reporting the sole session

1. A client calls `GET /status` when exactly one session is recorded.
2. Today, `getActive()` returns that session and `/status` includes its project, author, and last check-in time in `active`.
3. The plan removes `getActive()` and says `active` becomes null or is dropped. A client that uses the existing field to display the sole session will lose that information or need to handle a changed response.

**Smallest plan change:** Keep `getActive()` for `/status` only and preserve its current response field. It can remain status metadata without influencing project resolution.

I found no other concrete failures in the named files against the settled decisions.

**Plan size:** The plan gets bigger by retaining `getActive()` and its status behavior.
