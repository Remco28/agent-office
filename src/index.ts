import { main } from "./cli";

const code = await main(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(message + "\n");
  return 1;
});
process.exit(code);
