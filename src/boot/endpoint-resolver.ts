import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import type { ArgusConfig } from "../session/types.js";

const ConfigSchema = z
  .object({
    endpoint: z.string().url().optional(),
    defaultStoreCode: z.string().optional(),
    timeoutMs: z.number().int().positive().max(300_000).optional(),
  })
  .strict();

export type ResolvedEndpoint =
  | { source: "flag" | "env" | "file"; url: string; config: ArgusConfig }
  | { source: "missing"; url: null; config: ArgusConfig };

export function readConfigFile(path = join(homedir(), ".argusrc.json")): ArgusConfig {
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = ConfigSchema.parse(JSON.parse(raw));
    return parsed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`argus: invalid ${path}: ${msg}`);
  }
}

export function resolveEndpoint(opts: { flag?: string }): ResolvedEndpoint {
  const config = readConfigFile();
  if (opts.flag) {
    return { source: "flag", url: opts.flag, config };
  }
  const env = process.env.ARGUS_ENDPOINT;
  if (env && env.length > 0) {
    return { source: "env", url: env, config };
  }
  if (config.endpoint) {
    return { source: "file", url: config.endpoint, config };
  }
  return { source: "missing", url: null, config };
}

export function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
