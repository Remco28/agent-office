import { main } from "./cli";

const code = await main(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(message + "\n");
  return 1;
});
// Close stdout and leave only once it has drained. A bare `process.exit` drops
// whatever a pipe has not taken yet, so a reader slower than the CLI lost
// everything past the pipe's 64 KB buffer and got JSON that does not parse.
// A reader that hung up early (`office list | head -1`) is an error on the
// stream, and that leaves too.
process.stdout.on("error", () => process.exit(code));
process.stdout.end(() => process.exit(code));
