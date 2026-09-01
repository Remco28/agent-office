import { openDb } from "./db";
import { startSidecar, type Embedder } from "./embed";
import {
  backfillEmbeddings,
  context,
  countMemories,
  forget,
  listMemories,
  remember,
  search,
} from "./memory";
import { fileStats } from "./stats";
import { dbPath, MODEL_NAME, port } from "./paths";

export type Office = {
  stop: () => void;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function serve(opts?: { embedder?: Embedder; port?: number }): Office {
  const db = openDb();
  const embedder = opts?.embedder ?? startSidecar();
  const listen = opts?.port ?? port();
  const startedAt = new Date().toISOString();

  const backfill = async () => {
    try {
      await backfillEmbeddings(db, embedder);
    } catch (err) {
      console.error("office backfill:", err);
    }
  };

  const waitReady = async () => {
    for (let i = 0; i < 200; i++) {
      if (embedder.ready) {
        await backfill();
        return;
      }
      await Bun.sleep(100);
    }
  };
  void waitReady();

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: listen,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      if (req.method === "GET" && (path === "/health" || path === "/status" || path === "/")) {
        const files = fileStats(dbPath());
        const missing = (
          db.query("SELECT COUNT(*) AS n FROM memories WHERE embedding IS NULL").get() as {
            n: number;
          }
        ).n;
        const lastWrite =
          (db.query("SELECT MAX(created_at) AS t FROM memories").get() as { t: string | null })
            .t ?? null;
        return json({
          ok: true,
          name: "agent-office",
          memories: countMemories(db),
          missing_embeddings: missing,
          last_write: lastWrite,
          embedder: embedder.ready,
          model: MODEL_NAME,
          port: listen,
          pid: process.pid,
          started_at: startedAt,
          db: files,
        });
      }

      if (req.method === "POST" && path === "/checkpoint") {
        db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
        return json({ ok: true, db: fileStats(dbPath()) });
      }

      if (req.method === "GET" && path === "/list") {
        const limit = Number(url.searchParams.get("limit") ?? 20);
        return json({ memories: listMemories(db, limit) });
      }

      if (req.method === "POST" && path === "/remember") {
        const body = await readBody(req);
        const content = String(body.content ?? "").trim();
        if (!content) return json({ error: "content required" }, 400);
        const tags = Array.isArray(body.tags)
          ? body.tags.map((t) => String(t))
          : [];
        const source = body.source != null ? String(body.source) : null;
        const memory = await remember(db, embedder, { content, tags, source });
        void backfill();
        return json({ ok: true, memory });
      }

      if (req.method === "POST" && path === "/search") {
        const body = await readBody(req);
        const q = String(body.q ?? body.query ?? "");
        const limit = Number(body.limit ?? 8);
        return json({ hits: await search(db, embedder, q, limit) });
      }

      if (req.method === "POST" && path === "/context") {
        const body = await readBody(req);
        const q = String(body.q ?? body.query ?? "");
        const limit = Number(body.limit ?? 8);
        return json({ memories: await context(db, embedder, q, limit) });
      }

      if (req.method === "POST" && path === "/forget") {
        const body = await readBody(req);
        const id = Number(body.id);
        if (!Number.isInteger(id) || id <= 0) return json({ error: "id required" }, 400);
        return json({ ok: forget(db, id), id });
      }

      return json({ error: "not found" }, 404);
    },
  });

  console.error(`office listening on 127.0.0.1:${server.port}`);

  return {
    stop() {
      embedder.close();
      server.stop(true);
      db.close();
    },
  };
}
