import { unlinkSync } from "node:fs";
import {
  ensureDaemon,
  health,
  logTail,
  startDetach,
  stopDaemon,
  waitForHealth,
  writePid,
} from "./daemon";
import { baseUrl, dataDir, logPath, pidPath, port } from "./paths";
import { serve } from "./server";
import { formatAgo } from "./stats";
import { runTui } from "./tui";
import { detectCwdProject, normalizeProject } from "./scope";
import { initProject } from "./init";

type Opts = {
  tags: string[];
  project?: string;
  author?: string;
  role?: string;
  scope?: string;
  usage?: string;
  notes?: string;
  limit?: number;
  detach?: boolean;
  all?: boolean;
  text?: boolean;
  readonly?: boolean;
  rest: string[];
};

function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function printHits(
  hits: Array<{ id: number; content: string; tags: string[]; created_at: string; score?: number }>,
  /** Why there is nothing, when there is nothing. */
  note?: string | null,
): void {
  if (!hits.length) {
    // An empty read is the moment the reason matters most, so it is printed
    // rather than left for the JSON caller to notice.
    process.stdout.write(note ? `(none) — ${note}\n` : "(none)\n");
    return;
  }
  for (const hit of hits) {
    const tags = hit.tags.length ? `  [${hit.tags.join(", ")}]` : "";
    process.stdout.write(`#${hit.id}${tags}  ${hit.content}\n`);
  }
}

function parse(argv: string[]): { cmd: string; opts: Opts } {
  const args = argv.slice(2);
  let cmd = args.shift() ?? "tui";
  // `office --help` is a request for help, not the name of a command.
  if (cmd === "--help" || cmd === "-h") cmd = "help";
  const opts: Opts = { tags: [], rest: [] };
  while (args.length) {
    const a = args.shift()!;
    if (a === "--detach") opts.detach = true;
    else if (a === "--text") opts.text = true;
    else if (a === "--all") opts.all = true;
    else if (a === "--readonly" || a === "--read") opts.readonly = true;
    else if (a === "--global" || a === "--everywhere") opts.scope = "global";
    else if (a === "--tag" || a === "-t") {
      const value = args.shift();
      if (value) opts.tags.push(value);
    } else if (a === "--project" || a === "-p" || a === "--source" || a === "-s") {
      // --source is the old name for --project; the store used one column for both.
      opts.project = args.shift();
    } else if (a === "--by" || a === "-a") {
      opts.author = args.shift();
    } else if (a === "--role") {
      opts.role = args.shift();
    } else if (a === "--use") {
      opts.usage = args.shift();
    } else if (a === "--note") {
      opts.notes = args.shift();
    } else if (a === "--limit" || a === "-n") {
      opts.limit = Number(args.shift());
    } else if (a === "--help" || a === "-h") {
      return { cmd: "help", opts };
    } else if (a.startsWith("-")) {
      throw new Error(`unknown flag: ${a}`);
    } else {
      opts.rest.push(a);
    }
  }
  return { cmd, opts };
}

async function api(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<unknown> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : res.statusText;
    throw new Error(err);
  }
  return data;
}

/** What the caller declares. Unset means "use whatever the office remembers". */
function declaredProject(opts: Opts): string | null {
  const raw = opts.project ?? process.env.OFFICE_PROJECT ?? process.env.OFFICE_SOURCE ?? null;
  // Resolved here, in the caller's working directory. The daemon would resolve
  // a relative path against its own directory, which is only right by luck.
  return raw?.trim() ? normalizeProject(raw) : null;
}

function declaredAuthor(opts: Opts): string | null {
  return opts.author ?? process.env.OFFICE_AUTHOR ?? null;
}

/** The manager role is gone; a launcher still passing one is told, not ignored. */
function declaredRole(opts: Opts): string | null {
  return opts.role ?? process.env.OFFICE_ROLE ?? null;
}

function help(): string {
  return `agent-office — local working memory for coding agents

  office init [path]          set up a project repo for Agent Office: creates a
                              local git repo if needed, links skills, adds the
                              startup section to AGENTS.md unless it has one,
                              and links CLAUDE.md to it if there is none.
                              A missing folder is created and set up, unless it
                              is inside an existing repository (init stops and
                              names it) or holds other repositories a few
                              folders down. Apart from adding that section, it
                              changes no file it finds, never edits a link,
                              never writes to git's config and never hides
                              anything from git
  office begin [--project <path>] --by <agent>
                              start a session from inside the project's repo (or
                              any worktree of it): the project is taken from the
                              folder. One agent works in one repository. Use
                              --project where the folder gives no project (a
                              folder outside any repo), on every command there.
                              Returns tools, preferences,
                              sessions, activity, unfinished work, and memories
  office peek [--project <path>] [--by <agent>]
                              the same briefing, read-only: nothing is written
                              and your check-in time does not move. Use this
                              when you are told not to modify state. (Same as
                              begin --readonly.)
  office context [query]      memories and matching skills (recent memories if no query)
  office search <query>       find facts and relevant skills
  office remember [--tag t] [--global] <text>
  office list [--limit n]     recent memories, newest first
  office forget <id>          delete a memory
  office move <old path>      bring a moved project's notes to this folder's
                              project. Only when the human says it moved;
                              refused if the old folder still exists (a copy)
                              or this project already has notes

  office work                 unfinished work for this project; with no
                              project named, the items filed unclaimed
  office work open <title>    start a piece of work
  office work note <id> <text>   append where you got to
  office work close <id> [text]  say it is finished
  office work log [--all]     the whole trail, every project, newest first

  office issues [--all]       open issues about the office itself (anyone may
                              read; --all adds closed ones)
  office issue open <title>   the office blocks you, lacks something every
                              project would want, or is wrong. Not for bugs in
                              the repo you are working on. Search first
  office issue note <id> <text>   add to one instead of filing it twice
  office issue close <id> <resolution>   say what changed, or why not (required)

  office tools                what this machine has
  office tools add <name> [--use <cmd>] [--note <text>] <summary>
  office tools remove <name>

  office skills               skills for every project, from this checkout's
                              skills/ folder; read a SKILL.md when its task
                              comes up. Ones marked for another computer are
                              counted, not listed

  office serve [--detach]     start the localhost daemon
  office status               daemon health (JSON)
  office logs [-n <lines>]    the daemon's own output, for when it is unwell
  office stop                 stop the daemon
  office                      open the desk (humans)

Flags: --project/-p <path>  --by/-a <agent>  --tag/-t <tag>  --global  --limit/-n <n>
--readonly  the read-only begin: use with begin, or just run peek
The project is this command's --project (or OFFICE_PROJECT), else the
repository you run it in, else none: nothing is taken from what the office
remembers. --by signs your work with the numbered name begin gave you; without
it your writes are unsigned. Export OFFICE_AUTHOR instead of repeating the flag.
Work written with no project is filed unclaimed and named as such; a memory
with no project is refused (add --global if it applies to every project).
JSON is the default for agent commands. Pass --text for a short listing.
Daemon binds 127.0.0.1:${port()}. Data: ${dataDir()}
`;
}

type Hit = {
  id: number;
  content: string;
  tags: string[];
  created_at: string;
  score?: number;
  similarity?: number | null;
  via?: string;
};

function byline(author: string | null | undefined): string {
  return author ? ` by ${author}` : " (unattributed)";
}

type BriefingView = {
  banner?: string;
  project: string | null;
  project_source?: string;
  author: string | null;
  tools: Array<{ name: string; summary: string; usage: string | null }>;
  skills?: SkillView[];
  skills_elsewhere?: number;
  skills_problems?: Array<{ path: string; problem: string }>;
  preferences: Hit[];
  open_work: Array<{ id: number; title: string; last_note: string | null; last_note_author: string | null }>;
  open_work_note?: string | null;
  memories: Hit[];
  readonly?: boolean;
  readonly_note?: string | null;
  sessions?: Array<{
    author: string | null;
    project: string | null;
    since: string;
    last_seen?: string;
    is_you: boolean;
  }>;
  notices?: Array<{
    work_id: number;
    title: string;
    project?: string | null;
    kind: string;
    text: string;
    author: string | null;
    at: string;
  }>;
  notices_since?: string | null;
  notices_note?: string | null;
  author_warnings?: Array<{ level: string; text: string }>;
  sessions_hidden?: number;
  identity_note?: string | null;
  issues?: IssueView[];
  issues_open?: number;
  issues_closed?: IssueView[];
  note?: string | null;
};

type SkillView = { name: string; description: string; path: string; machines: string[] | null };

function printSkills(
  skills: SkillView[],
  elsewhere: number,
  problems: Array<{ path: string; problem: string }>,
  indent: string,
): string[] {
  const out: string[] = [];
  for (const skill of skills) {
    const only = skill.machines ? `  [this computer only]` : "";
    out.push(`${indent}${skill.name}  ${skill.description}${only}`);
    out.push(`${indent}  ${skill.path}`);
  }
  if (elsewhere) out.push(`${indent}(+${elsewhere} for other computers, not shown)`);
  for (const problem of problems) out.push(`${indent}! ${problem.path}: ${problem.problem}`);
  return out;
}

type IssueView = {
  id: number;
  title: string;
  author: string | null;
  last_note: string | null;
  last_note_author: string | null;
  closed?: boolean;
  closed_by?: string | null;
  resolution?: string | null;
};

function printBriefing(data: BriefingView): void {
  const out: string[] = [];
  if (data.banner) out.push(data.banner, "");
  out.push(`project  ${data.project ?? "(none declared)"}`);
  out.push(`author   ${data.author ?? "(unknown)"}`);
  if (data.identity_note) out.push(`         ${data.identity_note}`);
  // One session is already on the author line; more than one is the news.
  if ((data.sessions ?? []).length > 1) {
    out.push("", "sessions");
    for (const session of data.sessions ?? []) {
      const who = session.author ?? "(unattributed)";
      const you = session.is_you ? "  (you)" : "";
      out.push(`  ${who}${you}   last here ${formatAgo(session.since)}`);
    }
    if (data.sessions_hidden) out.push(`  (+${data.sessions_hidden} elsewhere or older, not shown)`);
  }
  const notices = data.notices ?? [];
  if (data.notices_since || notices.length) {
    out.push(
      "",
      data.notices_since
        ? `since you were last here (${formatAgo(data.notices_since)})`
        : "recent activity here",
    );
    if (!notices.length) out.push("  (nothing)");
    for (const notice of notices) {
      const what = notice.text ? `  — ${notice.text}` : "";
      // Only worth naming the project when the list is not already one
      // project's: a visitor with no project is shown the whole office.
      const where = data.notices_since ? "" : `  [${notice.project ?? "unclaimed"}]`;
      out.push(`  #${notice.work_id}  ${notice.kind}${byline(notice.author)}${where}${what}`);
    }
    if (data.notices_note) out.push(`  ${data.notices_note}`);
  }
  for (const issue of data.issues_closed ?? []) {
    out.push(
      "",
      `closed, an issue you filed: #${issue.id}  ${issue.title}  — ${issue.resolution ?? ""}${byline(issue.closed_by)}`,
    );
  }
  if (data.readonly_note) out.push("", `read-only   ${data.readonly_note}`);
  if (data.tools.length) {
    out.push("", "tools");
    for (const tool of data.tools) {
      out.push(`  ${tool.name}  ${tool.summary}${tool.usage ? `  (${tool.usage})` : ""}`);
    }
  }
  if (data.skills?.length || data.skills_elsewhere || data.skills_problems?.length) {
    out.push("", "skills");
    out.push(
      ...printSkills(data.skills ?? [], data.skills_elsewhere ?? 0, data.skills_problems ?? [], "  "),
    );
  }
  if (data.preferences.length) {
    out.push("", "everywhere");
    for (const memory of data.preferences) out.push(`  #${memory.id}  ${memory.content}`);
  }
  if (data.open_work.length) {
    out.push("", "unfinished");
    for (const item of data.open_work) {
      const note = item.last_note ? `  — ${item.last_note}${byline(item.last_note_author)}` : "";
      out.push(`  #${item.id}  ${item.title}${note}`);
    }
    if (data.open_work_note) out.push(`  ${data.open_work_note}`);
  }
  if (data.issues?.length) {
    out.push("", "issues (about the office itself)");
    for (const issue of data.issues) {
      const note = issue.last_note ? `  — ${issue.last_note}${byline(issue.last_note_author)}` : "";
      out.push(`  #${issue.id}  ${issue.title}${byline(issue.author)}${note}`);
    }
    const more = (data.issues_open ?? 0) - data.issues.length;
    if (more > 0) out.push(`  (+${more} more: office issues)`);
  }
  out.push("", "memories");
  if (!data.memories.length) out.push("  (none)");
  for (const memory of data.memories) {
    out.push(`  #${memory.id}  ${memory.content}`);
  }
  if (data.note) out.push("", `note     ${data.note}`);
  process.stdout.write(out.join("\n") + "\n");
}

/**
 * A session that declined to name itself is told so, on stderr, every time.
 * The office answers when asked; this is the one thing it volunteers.
 */
/**
 * Said on stderr by every command whose project came from the folder while the
 * session's own record named another. One agent works in one repository; this
 * is how an agent that wandered finds out at the moment it writes.
 */
function printScopeNote(data: unknown): void {
  const note = (data as { scope_note?: string | null } | null)?.scope_note;
  if (note) process.stderr.write(`warn: ${note}\n`);
}

function printAuthorWarnings(warnings: BriefingView["author_warnings"]): void {
  for (const warning of warnings ?? []) {
    process.stderr.write(`${warning.level}: ${warning.text}\n`);
  }
}

export async function main(argv = process.argv): Promise<number> {
  const { cmd, opts } = parse(argv);
  const asText = Boolean(opts.text);

  if (cmd === "help") {
    process.stdout.write(help());
    return 0;
  }

  if (cmd === "tui" || cmd === "desk") {
    return runTui();
  }

  if (cmd === "init") {
    const target = opts.project ?? opts.rest[0] ?? process.cwd();
    const result = initProject(target);
    if (asText) {
      process.stdout.write(result.message + "\n");
    } else {
      process.stderr.write(result.message + "\n");
      printJson(result);
    }
    for (const warning of result.warnings) process.stderr.write(`warn: ${warning}\n`);
    return 0;
  }

  if (cmd === "serve") {
    if (opts.detach) {
      if (await health()) {
        printJson(await health());
        return 0;
      }
      await startDetach();
      const h = await waitForHealth();
      if (h) {
        printJson(h);
        return 0;
      }
      throw new Error("detached office failed to become healthy");
    }
    writePid(process.pid);
    const office = serve();
    const shutdown = () => {
      office.stop();
      try {
        unlinkSync(pidPath());
      } catch {
        // ignore
      }
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    await new Promise(() => {});
    return 0;
  }

  if (cmd === "status") {
    const h = await health();
    if (!h) {
      printJson({ ok: false, error: "daemon not running" });
      return 1;
    }
    // Asked for here only: it looks at every stored project's folder.
    const gone = (await api("/projects/gone")) as { gone_projects?: unknown };
    printJson({ ...h, gone_projects: gone.gone_projects ?? [] });
    return 0;
  }

  if (cmd === "logs") {
    const lines = logTail(opts.limit ?? 40);
    if (!lines.length) {
      process.stdout.write(`(nothing in ${logPath()} yet)\n`);
      return 0;
    }
    process.stdout.write(lines.join("\n") + "\n");
    return 0;
  }

  if (cmd === "stop") {
    const was = await stopDaemon();
    printJson({ ok: true, was_running: was });
    return 0;
  }

  await ensureDaemon();

  if (cmd === "begin" || cmd === "peek") {
    // `peek` is `begin --readonly`: the friendly name for the door an agent
    // told not to modify state is allowed through.
    const readonly = cmd === "peek" || Boolean(opts.readonly);
    const data = (await api("/begin", {
      method: "POST",
      body: {
        project: declaredProject(opts),
        cwd_project: detectCwdProject(),
        author: declaredAuthor(opts),
        role: declaredRole(opts),
        readonly,
      },
    })) as BriefingView;
    if (asText) {
      printBriefing(data);
    } else {
      if (data.banner) process.stderr.write(`${data.banner}\n`);
      printJson(data);
    }
    printAuthorWarnings(data.author_warnings);
    printScopeNote(data);
    return 0;
  }

  if (cmd === "remember") {
    let content = opts.rest.join(" ").trim();
    if (!content && !process.stdin.isTTY) {
      content = (await Bun.stdin.text()).trim();
    }
    if (!content) {
      throw new Error("usage: office remember [--tag t] [--project p] <text>");
    }
    const data = (await api("/remember", {
      method: "POST",
      body: {
        content,
        tags: opts.tags,
        project: declaredProject(opts),
        cwd_project: detectCwdProject(),
        author: declaredAuthor(opts),
        scope: opts.scope ?? null,
      },
    }));
    printJson(data);
    printScopeNote(data);
    return 0;
  }

  if (cmd === "search" || cmd === "context") {
    const q = opts.rest.join(" ").trim();
    if (cmd === "search" && !q) throw new Error("usage: office search <query>");
    const data = (await api(`/${cmd}`, {
      method: "POST",
      body: {
        q,
        limit: opts.limit ?? 8,
        project: declaredProject(opts),
        cwd_project: detectCwdProject(),
        author: declaredAuthor(opts),
      },
    })) as {
      hits: Hit[];
      skill_hits: SkillView[];
      skills_problems: Array<{ path: string; problem: string }>;
      note?: string | null;
    };
    if (asText) {
      const skills = data.skill_hits ?? [];
      if (data.hits.length || !skills.length) printHits(data.hits, data.note);
      if (skills.length || data.skills_problems?.length) {
        process.stdout.write(["skills", ...printSkills(skills, 0, data.skills_problems ?? [], "  ")].join("\n") + "\n");
      }
    } else printJson(data);
    printScopeNote(data);
    return 0;
  }

  if (cmd === "list") {
    const listed = opts.project?.trim() ? normalizeProject(opts.project) : null;
    const query = listed ? `?project=${encodeURIComponent(listed)}&` : "?";
    const data = (await api(
      `/list${query}limit=${opts.limit ?? 20}`,
    )) as { memories: Hit[] };
    if (asText) printHits(data.memories);
    else printJson(data);
    return 0;
  }

  if (cmd === "forget") {
    const id = Number(opts.rest[0]);
    if (!Number.isInteger(id) || id <= 0) throw new Error("usage: office forget <id>");
    const data = (await api("/forget", { method: "POST", body: { id } })) as {
      ok: boolean;
      id: number;
    };
    printJson(data);
    if (!data.ok) {
      process.stderr.write(`no memory #${id}\n`);
      return 1;
    }
    return 0;
  }

  if (cmd === "move") {
    const from = opts.rest[0];
    if (!from) throw new Error("usage: office move <old path> [--project <new path>]");
    const data = await api("/move", {
      method: "POST",
      body: { from, project: declaredProject(opts), cwd_project: detectCwdProject() },
    });
    printJson(data);
    return 0;
  }

  if (cmd === "work") {
    const sub = opts.rest[0] ?? "list";
    if (sub === "list" || sub === "log") {
      const all = sub === "log" || opts.all ? "1" : "0";
      const params = new URLSearchParams({
        all,
        limit: String(opts.limit ?? 20),
        // The trail is asked for by name; anything else is scoped, and with no
        // project that means the unclaimed items rather than every project's.
        read: sub === "log" ? "trail" : "scoped",
      });
      const project = declaredProject(opts);
      const cwdProject = detectCwdProject();
      const author = declaredAuthor(opts);
      if (project) params.set("project", project);
      if (cwdProject) params.set("cwd_project", cwdProject);
      if (author) params.set("author", author);
      const data = (await api(`/work?${params}`)) as {
        work: Array<{
          id: number;
          title: string;
          author: string | null;
          last_note: string | null;
          last_note_author: string | null;
          closed: boolean;
        }>;
        project: string | null;
        read?: string;
        note?: string | null;
      };
      if (asText) {
        if (!data.work.length) process.stdout.write("(none)\n");
        for (const item of data.work) {
          const mark = item.closed ? "x" : " ";
          const note = item.last_note ? `  — last note${byline(item.last_note_author)}` : "";
          process.stdout.write(`[${mark}] #${item.id}  ${item.title}${note}\n`);
        }
        if (data.note) process.stdout.write(`${data.note}\n`);
      } else {
        printJson(data);
      }
      printScopeNote(data);
      return 0;
    }
    if (sub === "open") {
      const title = opts.rest.slice(1).join(" ").trim();
      if (!title) throw new Error("usage: office work open <title>");
      const data = (await api("/work/open", {
        method: "POST",
        body: {
          title,
          project: declaredProject(opts),
          cwd_project: detectCwdProject(),
          author: declaredAuthor(opts),
        },
      })) as { unclaimed?: boolean; note?: string | null };
      printJson(data);
      if (data.unclaimed && data.note) process.stderr.write(`warn: ${data.note}\n`);
      printScopeNote(data);
      return 0;
    }
    if (sub === "note" || sub === "close") {
      const id = Number(opts.rest[1]);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`usage: office work ${sub} <id> ${sub === "note" ? "<text>" : "[text]"}`);
      }
      const text = opts.rest.slice(2).join(" ").trim();
      if (sub === "note" && !text) throw new Error("usage: office work note <id> <text>");
      printJson(
        await api(`/work/${sub}`, {
          method: "POST",
          body: { id, text, author: declaredAuthor(opts) },
        }),
      );
      return 0;
    }
    throw new Error(`unknown work command: ${sub}\n${help()}`);
  }

  if (cmd === "issues" || cmd === "issue") {
    const sub = cmd === "issues" ? "list" : (opts.rest[0] ?? "list");
    if (sub === "list") {
      const params = new URLSearchParams({
        all: opts.all ? "1" : "0",
        limit: String(opts.limit ?? 20),
      });
      const data = (await api(`/issues?${params}`)) as { issues: IssueView[] };
      if (asText) {
        if (!data.issues.length) process.stdout.write("(none)\n");
        for (const issue of data.issues) {
          const mark = issue.closed ? "x" : " ";
          const note = issue.last_note ? `  — last note${byline(issue.last_note_author)}` : "";
          process.stdout.write(`[${mark}] #${issue.id}  ${issue.title}${byline(issue.author)}${note}\n`);
        }
      } else {
        printJson(data);
      }
      return 0;
    }
    if (sub === "open") {
      const title = opts.rest.slice(1).join(" ").trim();
      if (!title) throw new Error("usage: office issue open <title>");
      const data = await api("/issues/open", {
        method: "POST",
        body: {
          title,
          project: declaredProject(opts),
          cwd_project: detectCwdProject(),
          author: declaredAuthor(opts),
        },
      });
      printJson(data);
      printScopeNote(data);
      return 0;
    }
    if (sub === "note" || sub === "close") {
      const id = Number(opts.rest[1]);
      const label = sub === "note" ? "<text>" : "<resolution>";
      if (!Number.isInteger(id) || id <= 0) throw new Error(`usage: office issue ${sub} <id> ${label}`);
      const text = opts.rest.slice(2).join(" ").trim();
      if (!text) throw new Error(`usage: office issue ${sub} <id> ${label}`);
      printJson(
        await api(`/issues/${sub}`, {
          method: "POST",
          body: { id, text, author: declaredAuthor(opts) },
        }),
      );
      return 0;
    }
    throw new Error(`unknown issue command: ${sub}\n${help()}`);
  }

  if (cmd === "skills") {
    const data = (await api("/skills")) as {
      skills: SkillView[];
      elsewhere: number;
      problems: Array<{ path: string; problem: string }>;
    };
    if (asText) {
      const lines = printSkills(data.skills, data.elsewhere, data.problems, "");
      process.stdout.write((lines.length ? lines.join("\n") : "(none)") + "\n");
    } else {
      printJson(data);
    }
    return 0;
  }

  if (cmd === "tools") {
    const sub = opts.rest[0];
    if (!sub) {
      const data = (await api("/tools")) as { tools: unknown[] };
      if (asText) {
        const tools = data.tools as Array<{ name: string; summary: string; usage: string | null }>;
        if (!tools.length) process.stdout.write("(none)\n");
        for (const tool of tools) {
          process.stdout.write(
            `${tool.name}  ${tool.summary}${tool.usage ? `  (${tool.usage})` : ""}\n`,
          );
        }
      } else {
        printJson(data);
      }
      return 0;
    }
    if (sub === "add") {
      const name = opts.rest[1];
      const summary = opts.rest.slice(2).join(" ").trim();
      if (!name || !summary) {
        throw new Error('usage: office tools add <name> [--use <cmd>] "<summary>"');
      }
      printJson(
        await api("/tools", {
          method: "POST",
          body: { name, summary, usage: opts.usage ?? null, notes: opts.notes ?? null },
        }),
      );
      return 0;
    }
    if (sub === "remove" || sub === "rm") {
      const name = opts.rest[1];
      if (!name) throw new Error("usage: office tools remove <name>");
      const data = (await api("/tools/remove", { method: "POST", body: { name } })) as {
        ok: boolean;
        name: string;
      };
      printJson(data);
      if (!data.ok) {
        process.stderr.write(`no tool "${name}"\n`);
        return 1;
      }
      return 0;
    }
    throw new Error(`unknown tools command: ${sub}\n${help()}`);
  }

  throw new Error(`unknown command: ${cmd}\n${help()}`);
}
