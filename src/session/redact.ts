import { getSession } from "./store.js";

const REDACTED = "«redacted»";

const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /authorization/i,
  /admin[_-]?key/i,
  /password/i,
  /secret/i,
  /bearer/i,
  /api[_-]?key/i,
];

export function redact<T>(input: T): T {
  return walk(input) as T;
}

function walk(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(walk);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(k))) {
        out[k] = REDACTED;
      } else {
        out[k] = walk(v);
      }
    }
    return out;
  }
  return value;
}

function redactString(s: string): string {
  const session = getSession();
  let out = s;
  if (session.adminKey && session.adminKey.length > 0) {
    out = replaceAll(out, session.adminKey, REDACTED);
  }
  if (session.customerToken && session.customerToken.length > 0) {
    out = replaceAll(out, session.customerToken, REDACTED);
  }
  out = out.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, `Bearer ${REDACTED}`);
  return out;
}

function replaceAll(haystack: string, needle: string, repl: string): string {
  if (!needle) return haystack;
  return haystack.split(needle).join(repl);
}

export const REDACTED_SENTINEL = REDACTED;
