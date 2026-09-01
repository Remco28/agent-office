import { detectPython, MODEL_NAME, SIDECAR } from "./paths";

export type Embedder = {
  ready: boolean;
  dim: number;
  encode(text: string): Promise<Float32Array | null>;
  close(): void;
};

type Pending = {
  resolve: (value: Float32Array | null) => void;
  reject: (err: Error) => void;
};

export function fakeEmbedder(dim = 384): Embedder {
  return {
    ready: true,
    dim,
    async encode(text: string) {
      const vector = new Float32Array(dim);
      let hash = 2166136261;
      for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      for (let i = 0; i < dim; i++) {
        vector[i] = ((hash + i * 9973) % 2000) / 1000 - 1;
      }
      let norm = 0;
      for (let i = 0; i < dim; i++) norm += vector[i] * vector[i];
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let i = 0; i < dim; i++) vector[i] /= norm;
      }
      return vector;
    },
    close() {},
  };
}

export function startSidecar(): Embedder {
  const python = detectPython();
  const pending = new Map<string, Pending>();
  let buffer = "";
  let ready = false;
  let dim = 384;
  let proc: Bun.Subprocess<"pipe", "pipe", "inherit"> | null = null;
  let closed = false;

  const spawn = () => {
    proc = Bun.spawn({
      cmd: [python, SIDECAR, MODEL_NAME],
      stdin: "pipe",
      stdout: "pipe",
      stderr: "inherit",
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
    void readStdout();
    void proc.exited.then((code) => {
      if (closed) return;
      ready = false;
      failAll(new Error(`embedder exited (${code})`));
      setTimeout(spawn, 500);
    });
  };

  const failAll = (err: Error) => {
    for (const item of pending.values()) item.reject(err);
    pending.clear();
  };

  const handleLine = (line: string) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return;
    }
    if (!ready && "ok" in msg) {
      if (msg.ok) {
        ready = true;
        if (typeof msg.dim === "number" && msg.dim > 0) dim = msg.dim;
      } else {
        console.error(`office embedder: ${String(msg.error ?? "failed to start")}`);
      }
      return;
    }
    const id = String(msg.id ?? "");
    const waiter = pending.get(id);
    if (!waiter) return;
    pending.delete(id);
    if (msg.error) {
      waiter.resolve(null);
      return;
    }
    const raw = msg.embedding;
    if (!Array.isArray(raw)) {
      waiter.resolve(null);
      return;
    }
    waiter.resolve(Float32Array.from(raw.map((n) => Number(n))));
  };

  const readStdout = async () => {
    if (!proc?.stdout) return;
    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx = buffer.indexOf("\n");
        while (idx >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (line) handleLine(line);
          idx = buffer.indexOf("\n");
        }
      }
    } catch {
      // process died; exited handler restarts
    }
  };

  spawn();

  return {
    get ready() {
      return ready;
    },
    get dim() {
      return dim;
    },
    encode(text: string) {
      const trimmed = text.trim();
      if (!trimmed || !proc?.stdin) return Promise.resolve(null);
      const id = crypto.randomUUID();
      return new Promise<Float32Array | null>((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          resolve(null);
        }, 30_000);
        pending.set(id, {
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          reject: (err) => {
            clearTimeout(timer);
            reject(err);
          },
        });
        try {
          proc!.stdin.write(JSON.stringify({ id, text: trimmed }) + "\n");
          proc!.stdin.flush();
        } catch (err) {
          pending.delete(id);
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    },
    close() {
      closed = true;
      failAll(new Error("embedder closed"));
      proc?.kill();
      proc = null;
    },
  };
}

export function packing(vector: Float32Array): Buffer {
  return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
}

export function unpacking(blob: Uint8Array | Buffer | null): Float32Array | null {
  if (!blob || blob.byteLength < 4 || blob.byteLength % 4 !== 0) return null;
  const copy = blob instanceof Buffer ? blob : Buffer.from(blob);
  return new Float32Array(copy.buffer, copy.byteOffset, copy.byteLength / 4);
}

export function dot(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += a[i] * b[i];
  return sum;
}
