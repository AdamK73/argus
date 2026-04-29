export interface LogEntry {
  ts: number;
  op: string;
  authMode: "admin" | "customer" | "none";
  status: number;
  ms: number;
  errorCount: number;
  firstError?: string;
}

const MAX = 64;
const buffer: LogEntry[] = [];
const subscribers = new Set<() => void>();

export function appendLog(entry: LogEntry): void {
  buffer.push(entry);
  if (buffer.length > MAX) buffer.shift();
  for (const fn of subscribers) fn();
}

export function getLog(limit = MAX): LogEntry[] {
  if (limit >= buffer.length) return buffer.slice();
  return buffer.slice(buffer.length - limit);
}

export function clearLog(): void {
  buffer.length = 0;
  for (const fn of subscribers) fn();
}

export function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
