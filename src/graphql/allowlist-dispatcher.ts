import { Agent, type Dispatcher } from "undici";

export class EgressDeniedError extends Error {
  constructor(host: string, allowed: string) {
    super(`egress denied: ${host} not in allow-list (allowed: ${allowed})`);
    this.name = "EgressDeniedError";
  }
}

export interface AllowListOptions {
  allowedHost: string;
  timeoutMs: number;
}

export function createAllowListDispatcher(opts: AllowListOptions): Dispatcher {
  const inner = new Agent({
    headersTimeout: opts.timeoutMs,
    bodyTimeout: opts.timeoutMs,
    connect: { timeout: opts.timeoutMs },
  });
  const allowed = opts.allowedHost.toLowerCase();

  const dispatch: Dispatcher["dispatch"] = (options, handler) => {
    try {
      const origin = options.origin?.toString();
      if (!origin) {
        throw new EgressDeniedError("<unknown>", allowed);
      }
      const url = new URL(origin);
      const host = url.host.toLowerCase();
      if (host !== allowed) {
        throw new EgressDeniedError(host, allowed);
      }
    } catch (err) {
      if (err instanceof EgressDeniedError) {
        queueMicrotask(() => {
          handler.onError?.(err);
        });
        return false;
      }
      throw err;
    }
    return inner.dispatch(options, handler);
  };

  const proxy = new Proxy(inner, {
    get(target, prop, receiver) {
      if (prop === "dispatch") return dispatch;
      const v = Reflect.get(target, prop, receiver);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return proxy as Dispatcher;
}
