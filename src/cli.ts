import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from "node:fs";
import { baseUrl, dataDir, pidPath, port, ROOT } from "./paths";
import { serve } from "./server";

type Opts = {
  tags: string[];
  source?: string;
  limit?: number;
  detach?: boolean;
  text?: boolean;
  rest: string[];
};

function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function printHits(hits: Array<{ id: number; content: string; tags: string[]; created_at: string; score?: number }>): void {
  if (!hits.length) {
    process.stdout.write("(none)\n");
    return;
  }
  for (const hit of hits) {
    const tags = hit.tags.length ? `  [${hit.tags.join(", ")}]` : "";
    process.stdout.write(`#${hit.id}${tags}  ${hit.content}\n`);
  }
}

function parse(argv: string[]): { cmd: string; opts: Opts } {
  const args = argv.slice(2);
  const cmd = args.shift() ?? "help";
  const opts: Opts = { tags: [], rest: [] };
  while (args.length) {
    const a = args.shift()!;
    if (a === "--detach") opts.detach = true;
    else if (a === "--text") opts.text = true;
    else if (a === "--tag" || a === "-t") {
      const value = args.shift();
      if (value) opts.tags.push(value);
    } else if (a === "--source" || a === "-s") {
      opts.source = args.shift();
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

async function health(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${baseUrl()}/health`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function writePid(pid: number): void {
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(pidPath(), String(pid));
}

function readPid(): number | null {
  if (!existsSync(pidPath())) return null;
  const n = Number(readFileSync(pidPath(), "utf8").trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
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
    const err = data && typeof data === "object" && "error" in data
      ? String((data as { error: unknown }).error)
      : res.statusText;
    throw new Error(err);
  }
  return data;
}

async function detachServe(): Promise<void> {
  const child = Bun.spawn({
    cmd: ["bun", `${ROOT}/src/index.ts`, "serve"],
    cwd: ROOT,
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: process.env,
  });
  writePid(child.pid);
  child.unref();
}

async function ensureDaemon(): Promise<void> {
  if (await health()) return;
  await detachServe();
  for (let i = 0; i < 80; i++) {
    await Bun.sleep(100);
    if (await health()) return;
  }
  throw new Error("office daemon failed to start; try `office serve` in the foreground");
}

function help(): string {
  return `agent-office — local working memory for coding agents

  office serve [--detach]     start the localhost daemon
  office status               daemon health
  office stop                 stop the daemon

  office context [query]      memories for this task (recent if no query)
  office remember [--tag t] [--source s] <text>
  office search <query>
  office list [--limit n]
  office forget <id>

JSON is the default. Pass --text for a short listing.
Daemon binds 127.0.0.1:${port()}. Data: ${dataDir()}
`;
}

export async function main(argv = process.argv): Promise<number> {
  const { cmd, opts } = parse(argv);
  const asText = Boolean(opts.text);

  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    process.stdout.write(help());
    return 0;
  }

  if (cmd === "serve") {
    if (opts.detach) {
      if (await health()) {
        printJson(await health());
        return 0;
      }
      await detachServe();
      for (let i = 0; i < 80; i++) {
        await Bun.sleep(100);
        const h = await health();
        if (h) {
          printJson(h);
          return 0;
        }
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
    printJson(h);
    return 0;
  }

  if (cmd === "stop") {
    const h = await health();
    const pid = readPid();
    if (pid && pidAlive(pid)) {
      process.kill(pid, "SIGTERM");
    }
    try {
      unlinkSync(pidPath());
    } catch {
      // ignore
    }
    printJson({ ok: true, was_running: Boolean(h) });
    return 0;
  }

  await ensureDaemon();

  if (cmd === "remember") {
    let content = opts.rest.join(" ").trim();
    if (!content && !process.stdin.isTTY) {
      content = (await Bun.stdin.text()).trim();
    }
    if (!content) throw new Error("usage: office remember [--tag t] [--source s] <text>");
    const data = (await api("/remember", {
      method: "POST",
      body: {
        content,
        tags: opts.tags,
        source: opts.source ?? process.env.OFFICE_SOURCE ?? null,
      },
    })) as { memory: { id: number; content: string; tags: string[] } };
    printJson(data);
    return 0;
  }

  if (cmd === "search") {
    const q = opts.rest.join(" ").trim();
    if (!q) throw new Error("usage: office search <query>");
    const data = (await api("/search", {
      method: "POST",
      body: { q, limit: opts.limit ?? 8 },
    })) as { hits: Array<{ id: number; content: string; tags: string[]; created_at: string; score: number }> };
    if (asText) printHits(data.hits);
    else printJson(data);
    return 0;
  }

  if (cmd === "context") {
    const q = opts.rest.join(" ").trim();
    const data = (await api("/context", {
      method: "POST",
      body: { q, limit: opts.limit ?? 8 },
    })) as { memories: Array<{ id: number; content: string; tags: string[]; created_at: string; score?: number }> };
    if (asText) printHits(data.memories);
    else printJson(data);
    return 0;
  }

  if (cmd === "list") {
    const data = (await api(`/list?limit=${opts.limit ?? 20}`)) as {
      memories: Array<{ id: number; content: string; tags: string[]; created_at: string }>;
    };
    if (asText) printHits(data.memories);
    else printJson(data);
    return 0;
  }

  if (cmd === "forget") {
    const id = Number(opts.rest[0]);
    if (!Number.isInteger(id) || id <= 0) throw new Error("usage: office forget <id>");
    printJson(await api("/forget", { method: "POST", body: { id } }));
    return 0;
  }

  throw new Error(`unknown command: ${cmd}\n${help()}`);
}
