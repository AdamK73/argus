import { request, type Dispatcher } from "undici";
import { createAllowListDispatcher } from "./allowlist-dispatcher.js";
import { getSession } from "../session/store.js";
import { appendLog } from "../session/log.js";

export interface GraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLResult<T> {
  data: T | null;
  errors?: GraphQLError[];
  status: number;
}

export interface CallOptions {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
  authMode: "admin" | "customer" | "none";
  storeCode?: string | null;
  timeoutMs?: number;
}

let dispatcher: Dispatcher | null = null;
let dispatcherHost = "";

function getDispatcher(timeoutMs: number): Dispatcher {
  const session = getSession();
  if (!dispatcher || dispatcherHost !== session.endpointHost) {
    dispatcher = createAllowListDispatcher({
      allowedHost: session.endpointHost,
      timeoutMs,
    });
    dispatcherHost = session.endpointHost;
  }
  return dispatcher;
}

export async function call<T = unknown>(opts: CallOptions): Promise<GraphQLResult<T>> {
  const session = getSession();
  if (!session.endpoint) {
    throw new Error("argus: endpoint not configured");
  }
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (opts.authMode === "admin") {
    if (!session.adminKey) throw new Error("argus: admin key missing");
    headers["Authorization"] = `Bearer ${session.adminKey}`;
  } else if (opts.authMode === "customer") {
    if (!session.customerToken) throw new Error("argus: customer token missing");
    headers["Authorization"] = `Bearer ${session.customerToken}`;
  }
  const storeCode = opts.storeCode ?? session.storeCode;
  if (storeCode) headers["Store"] = storeCode;

  const body = JSON.stringify({
    query: opts.query,
    variables: opts.variables ?? {},
    operationName: opts.operationName,
  });

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const opName = opts.operationName ?? "anonymous";
  const t0 = Date.now();

  try {
    const res = await request(session.endpoint, {
      method: "POST",
      headers,
      body,
      dispatcher: getDispatcher(timeoutMs),
      signal: ac.signal,
    });
    const text = await res.body.text();
    let parsed: { data?: T; errors?: GraphQLError[] };
    try {
      parsed = JSON.parse(text) as { data?: T; errors?: GraphQLError[] };
    } catch {
      const result: GraphQLResult<T> = {
        data: null,
        errors: [{ message: `non-json response (status ${res.statusCode}): ${text.slice(0, 200)}` }],
        status: res.statusCode,
      };
      logResult(opName, opts.authMode, t0, result);
      return result;
    }
    const result: GraphQLResult<T> = {
      data: parsed.data ?? null,
      ...(parsed.errors ? { errors: parsed.errors } : {}),
      status: res.statusCode,
    };
    logResult(opName, opts.authMode, t0, result);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const result: GraphQLResult<T> = {
      data: null,
      errors: [{ message }],
      status: 0,
    };
    logResult(opName, opts.authMode, t0, result);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

function logResult(
  op: string,
  authMode: "admin" | "customer" | "none",
  t0: number,
  result: GraphQLResult<unknown>
): void {
  appendLog({
    ts: Date.now(),
    op,
    authMode,
    status: result.status,
    ms: Date.now() - t0,
    errorCount: result.errors?.length ?? 0,
    ...(result.errors && result.errors[0] ? { firstError: result.errors[0].message } : {}),
  });
}
