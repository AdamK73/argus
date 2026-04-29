import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { redact } from "../session/redact.js";
import { isoTimestampSafe } from "./clock.js";

export interface DumpOptions {
  email: string;
  payload: unknown;
  cwd?: string;
}

export function writeSnapshot(opts: DumpOptions): string {
  const cwd = opts.cwd ?? process.cwd();
  const dir = resolve(cwd, "argus-snapshots");
  mkdirSync(dir, { recursive: true });
  const stamp = isoTimestampSafe();
  const hash = createHash("sha1").update(opts.email).digest("hex").slice(0, 8);
  const file = join(dir, `${stamp}__${hash}.json`);
  const sanitised = redact(opts.payload);
  writeFileSync(file, JSON.stringify(sanitised, null, 2), { encoding: "utf8", mode: 0o600 });
  return file;
}
