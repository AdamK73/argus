#!/usr/bin/env node

// src/cli.tsx
import { render } from "ink";

// src/app.tsx
import { useState as useState9 } from "react";
import { Box as Box15, Text as Text14, useApp as useApp4, useInput as useInput7 } from "ink";

// src/boot/splash.tsx
import { useEffect, useState } from "react";
import { Box as Box2 } from "ink";

// src/ui/logo.tsx
import { Box, Text } from "ink";

// src/ui/theme.ts
var palette = {
  fg: "#E5E5E5",
  dim: "#6B6B6B",
  accent: "#D97757",
  success: "#7BB382",
  error: "#D87470",
  warn: "#D9A05B",
  border: "#2E2E2E"
};
var motion = {
  splashRevealMs: 400,
  hoverEaseMs: 60,
  modeEnterMs: 120,
  spinnerFrameMs: 80,
  flashMs: 200,
  statusTickMs: 1e3
};

// src/ui/logo.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Logo({ reveal = 1, subtitle = true }) {
  const full = "argus";
  const r = Math.min(1, Math.max(0, reveal));
  const charsToShow = Math.max(1, Math.round(full.length * r));
  const text = full.slice(0, charsToShow);
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx(Text, { color: palette.accent, children: text }),
    subtitle ? /* @__PURE__ */ jsx(Text, { color: palette.dim, children: "magento 2 graphql \xB7 the hundred-eyed watcher" }) : null
  ] });
}

// src/boot/splash.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var FRAMES = 6;
var TOTAL_MS = 700;
var HOLD_MS = 250;
function Splash({ onDone }) {
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    const tick = TOTAL_MS / FRAMES;
    const id = setInterval(() => {
      setFrame((f) => {
        const next = f + 1;
        if (next >= FRAMES) {
          clearInterval(id);
          setTimeout(onDone, HOLD_MS);
          return FRAMES;
        }
        return next;
      });
    }, tick);
    return () => clearInterval(id);
  }, [onDone]);
  return /* @__PURE__ */ jsx2(Box2, { paddingX: 2, paddingY: 1, children: /* @__PURE__ */ jsx2(Logo, { reveal: Math.min(1, frame / FRAMES), subtitle: frame >= FRAMES }) });
}

// src/boot/admin-key-prompt.tsx
import { useState as useState2 } from "react";
import { Box as Box3, Text as Text2, useApp, useInput } from "ink";
import Spinner from "ink-spinner";

// src/session/store.ts
var session = {
  adminKey: null,
  endpoint: "",
  endpointHost: "",
  customerToken: null,
  storeCode: null,
  customerEmail: null,
  startedAt: Date.now()
};
function getSession() {
  return session;
}
function setEndpoint(url) {
  session.endpoint = url;
  try {
    session.endpointHost = new URL(url).host;
  } catch {
    session.endpointHost = url;
  }
}
function setAdminKey(key) {
  session.adminKey = key;
}
function setCustomerToken(token) {
  session.customerToken = token;
}
function setStoreCode(code) {
  session.storeCode = code;
}
function setCustomerEmail(email) {
  session.customerEmail = email;
}
function clearModeState() {
  zeroize(session.customerToken);
  session.customerToken = null;
  session.customerEmail = null;
  session.storeCode = null;
}
function shutdown() {
  zeroize(session.adminKey);
  zeroize(session.customerToken);
  session.adminKey = null;
  session.customerToken = null;
  session.customerEmail = null;
  session.storeCode = null;
}
function zeroize(value) {
  if (!value) return;
  const buf = Buffer.from(value, "utf8");
  buf.fill(0);
}
function sessionElapsedSeconds() {
  return Math.floor((Date.now() - session.startedAt) / 1e3);
}

// src/graphql/client.ts
import { request } from "undici";

// src/graphql/allowlist-dispatcher.ts
import { Agent } from "undici";
var EgressDeniedError = class extends Error {
  constructor(host, allowed) {
    super(`egress denied: ${host} not in allow-list (allowed: ${allowed})`);
    this.name = "EgressDeniedError";
  }
};
function createAllowListDispatcher(opts) {
  const inner = new Agent({
    headersTimeout: opts.timeoutMs,
    bodyTimeout: opts.timeoutMs,
    connect: { timeout: opts.timeoutMs }
  });
  const allowed = opts.allowedHost.toLowerCase();
  const dispatch = (options, handler) => {
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
    }
  });
  return proxy;
}

// src/session/log.ts
var MAX = 64;
var buffer = [];
var subscribers = /* @__PURE__ */ new Set();
function appendLog(entry) {
  buffer.push(entry);
  if (buffer.length > MAX) buffer.shift();
  for (const fn of subscribers) fn();
}
function getLog(limit = MAX) {
  if (limit >= buffer.length) return buffer.slice();
  return buffer.slice(buffer.length - limit);
}
function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

// src/graphql/client.ts
var dispatcher = null;
var dispatcherHost = "";
function getDispatcher(timeoutMs) {
  const session2 = getSession();
  if (!dispatcher || dispatcherHost !== session2.endpointHost) {
    dispatcher = createAllowListDispatcher({
      allowedHost: session2.endpointHost,
      timeoutMs
    });
    dispatcherHost = session2.endpointHost;
  }
  return dispatcher;
}
async function call(opts) {
  const session2 = getSession();
  if (!session2.endpoint) {
    throw new Error("argus: endpoint not configured");
  }
  const timeoutMs = opts.timeoutMs ?? 1e4;
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json"
  };
  if (opts.authMode === "admin") {
    if (!session2.adminKey) throw new Error("argus: admin key missing");
    headers["Authorization"] = `Bearer ${session2.adminKey}`;
  } else if (opts.authMode === "customer") {
    if (!session2.customerToken) throw new Error("argus: customer token missing");
    headers["Authorization"] = `Bearer ${session2.customerToken}`;
  }
  const storeCode = opts.storeCode ?? session2.storeCode;
  if (storeCode) headers["Store"] = storeCode;
  const body = JSON.stringify({
    query: opts.query,
    variables: opts.variables ?? {},
    operationName: opts.operationName
  });
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const opName = opts.operationName ?? "anonymous";
  const t0 = Date.now();
  try {
    const res = await request(session2.endpoint, {
      method: "POST",
      headers,
      body,
      dispatcher: getDispatcher(timeoutMs),
      signal: ac.signal
    });
    const text = await res.body.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const result2 = {
        data: null,
        errors: [{ message: `non-json response (status ${res.statusCode}): ${text.slice(0, 200)}` }],
        status: res.statusCode
      };
      logResult(opName, opts.authMode, t0, result2);
      return result2;
    }
    const result = {
      data: parsed.data ?? null,
      ...parsed.errors ? { errors: parsed.errors } : {},
      status: res.statusCode
    };
    logResult(opName, opts.authMode, t0, result);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const result = {
      data: null,
      errors: [{ message }],
      status: 0
    };
    logResult(opName, opts.authMode, t0, result);
    return result;
  } finally {
    clearTimeout(timer);
  }
}
function logResult(op, authMode, t0, result) {
  appendLog({
    ts: Date.now(),
    op,
    authMode,
    status: result.status,
    ms: Date.now() - t0,
    errorCount: result.errors?.length ?? 0,
    ...result.errors && result.errors[0] ? { firstError: result.errors[0].message } : {}
  });
}

// src/graphql/operations/ping.ts
var PING_QUERY = (
  /* GraphQL */
  `
  query ArgusPing {
    storeConfig {
      store_code
      default_display_currency_code
    }
  }
`
);

// src/boot/endpoint-resolver.ts
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { z } from "zod";
var ConfigSchema = z.object({
  endpoint: z.string().url().optional(),
  defaultStoreCode: z.string().optional(),
  timeoutMs: z.number().int().positive().max(3e5).optional()
}).strict();
var BUILTIN_ENDPOINT = "https://gymbeam.sk/graphql";
function readConfigFile(path = join(homedir(), ".argusrc.json")) {
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
function resolveEndpoint(opts) {
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
  if (BUILTIN_ENDPOINT) {
    return { source: "builtin", url: BUILTIN_ENDPOINT, config };
  }
  return { source: "missing", url: null, config };
}
function isValidUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// src/boot/admin-key-prompt.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var MAX_ATTEMPTS = 3;
function AdminKeyPrompt({ initialEndpoint, onReady }) {
  const app = useApp();
  const [stage, setStage] = useState2(
    initialEndpoint ? (() => {
      setEndpoint(initialEndpoint);
      return { kind: "key", value: "", attempt: 1 };
    })() : { kind: "endpoint", value: "" }
  );
  useInput((input, key) => {
    if (stage.kind === "endpoint") {
      if (key.return) {
        if (!isValidUrl(stage.value)) {
          setStage({ ...stage, error: "invalid url" });
          return;
        }
        setEndpoint(stage.value);
        setStage({ kind: "key", value: "", attempt: 1 });
        return;
      }
      if (key.backspace || key.delete) {
        setStage({ kind: "endpoint", value: stage.value.slice(0, -1) });
        return;
      }
      if (key.ctrl && input === "c") {
        app.exit();
        return;
      }
      if (input && !key.meta && !key.ctrl) {
        setStage({ kind: "endpoint", value: stage.value + input });
      }
      return;
    }
    if (stage.kind === "key") {
      if (key.return) {
        if (stage.value.length === 0) {
          setStage({ ...stage, error: "key required" });
          return;
        }
        const attempt = stage.attempt;
        const k = stage.value;
        setStage({ kind: "validating", key: k, attempt });
        void validate(k, attempt, setStage, onReady, app.exit);
        return;
      }
      if (key.backspace || key.delete) {
        setStage({ ...stage, value: stage.value.slice(0, -1), error: void 0 });
        return;
      }
      if (key.ctrl && input === "c") {
        app.exit();
        return;
      }
      if (input && !key.meta && !key.ctrl) {
        setStage({ ...stage, value: stage.value + input, error: void 0 });
      }
      return;
    }
    if (stage.kind === "failed") {
      if (key.ctrl && input === "c") {
        app.exit();
        return;
      }
      setStage({ kind: "key", value: "", attempt: stage.attempt + 1 });
      return;
    }
    if (stage.kind === "fatal") {
      app.exit();
    }
  });
  if (stage.kind === "endpoint") {
    return /* @__PURE__ */ jsxs2(Box3, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
      /* @__PURE__ */ jsx3(Text2, { color: palette.dim, children: "graphql endpoint" }),
      /* @__PURE__ */ jsxs2(Box3, { marginTop: 1, children: [
        /* @__PURE__ */ jsx3(Text2, { color: palette.accent, children: "\u203A " }),
        /* @__PURE__ */ jsx3(Text2, { color: palette.fg, children: stage.value }),
        /* @__PURE__ */ jsx3(Text2, { color: palette.accent, children: "\u258C" })
      ] }),
      /* @__PURE__ */ jsx3(Box3, { marginTop: 1, children: stage.error ? /* @__PURE__ */ jsx3(Text2, { color: palette.error, children: stage.error }) : /* @__PURE__ */ jsx3(Text2, { color: palette.dim, children: "full url to your /graphql endpoint    e.g. https://yourshop.tld/graphql" }) })
    ] });
  }
  if (stage.kind === "key") {
    const masked = "\u2022".repeat(stage.value.length);
    return /* @__PURE__ */ jsxs2(Box3, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
      /* @__PURE__ */ jsxs2(Text2, { color: palette.dim, children: [
        "admin api key",
        stage.attempt > 1 ? `   attempt ${stage.attempt}/${MAX_ATTEMPTS}` : ""
      ] }),
      /* @__PURE__ */ jsxs2(Box3, { marginTop: 1, children: [
        /* @__PURE__ */ jsx3(Text2, { color: palette.accent, children: "\u203A " }),
        /* @__PURE__ */ jsx3(Text2, { color: palette.fg, children: masked }),
        /* @__PURE__ */ jsx3(Text2, { color: palette.accent, children: "\u258C" })
      ] }),
      /* @__PURE__ */ jsx3(Box3, { marginTop: 1, children: stage.error ? /* @__PURE__ */ jsx3(Text2, { color: palette.error, children: stage.error }) : /* @__PURE__ */ jsxs2(Text2, { color: palette.dim, children: [
        "endpoint  ",
        getSession().endpointHost
      ] }) })
    ] });
  }
  if (stage.kind === "validating") {
    return /* @__PURE__ */ jsxs2(Box3, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
      /* @__PURE__ */ jsxs2(Box3, { children: [
        /* @__PURE__ */ jsx3(Text2, { color: palette.accent, children: /* @__PURE__ */ jsx3(Spinner, { type: "dots" }) }),
        /* @__PURE__ */ jsx3(Text2, { color: palette.fg, children: " validating" })
      ] }),
      /* @__PURE__ */ jsxs2(Text2, { color: palette.dim, children: [
        "endpoint  ",
        getSession().endpointHost
      ] })
    ] });
  }
  if (stage.kind === "failed") {
    return /* @__PURE__ */ jsxs2(Box3, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
      /* @__PURE__ */ jsxs2(Text2, { color: palette.error, children: [
        "auth failed   ",
        stage.error
      ] }),
      /* @__PURE__ */ jsxs2(Text2, { color: palette.dim, children: [
        "attempt ",
        stage.attempt,
        "/",
        MAX_ATTEMPTS,
        "    any key to retry    ctrl-c to quit"
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs2(Box3, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
    /* @__PURE__ */ jsxs2(Text2, { color: palette.error, children: [
      "fatal   ",
      stage.error
    ] }),
    /* @__PURE__ */ jsx3(Text2, { color: palette.dim, children: "any key to exit" })
  ] });
}
async function validate(key, attempt, setStage, onReady, exit) {
  setAdminKey(key);
  const res = await call({
    query: PING_QUERY,
    authMode: "admin"
  });
  if (res.status === 200 && res.data?.storeConfig) {
    onReady();
    return;
  }
  const reason = describePingFailure(res);
  if (attempt >= MAX_ATTEMPTS) {
    setStage({ kind: "fatal", error: `${reason} \u2014 attempts exhausted` });
    setTimeout(() => exit(), 1200);
    return;
  }
  setStage({ kind: "failed", attempt, error: reason });
}
function describePingFailure(res) {
  if (res.status === 0) {
    return res.errors?.[0]?.message ?? "network error";
  }
  if (res.status === 401 || res.status === 403) {
    return `unauthorized (${res.status})`;
  }
  const first = res.errors?.[0]?.message;
  if (first) return first;
  return `request failed (status ${res.status})`;
}

// src/modes/menu.tsx
import React3, { useState as useState3 } from "react";
import { Box as Box4, Text as Text3, useApp as useApp2, useInput as useInput2 } from "ink";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var ITEMS = [
  { key: "blitzkrieg", label: "blitzkrieg", hint: "fast customer probe", enabled: true, group: "primary" },
  { key: "cart-forge", label: "cart forge", hint: "planned", enabled: false, group: "primary" },
  { key: "schema-diff", label: "schema diff", hint: "planned", enabled: false, group: "primary" },
  { key: "mutation-lab", label: "mutation lab", hint: "planned", enabled: false, group: "primary" },
  { key: "cache-inspector", label: "cache inspector", hint: "planned", enabled: false, group: "primary" },
  { key: "settings", label: "settings", hint: "", enabled: true, group: "system" },
  { key: "quit", label: "quit", hint: "", enabled: true, group: "system" }
];
function Menu({ onSelect }) {
  const enabledIdxs = ITEMS.flatMap((it, i) => it.enabled ? [i] : []);
  const [cursor, setCursor] = useState3(enabledIdxs[0] ?? 0);
  const app = useApp2();
  useInput2((input, key) => {
    if (key.upArrow || input === "k") {
      setCursor((c) => prevEnabled(c));
      return;
    }
    if (key.downArrow || input === "j") {
      setCursor((c) => nextEnabled(c));
      return;
    }
    if (key.return) {
      const item = ITEMS[cursor];
      if (item && item.enabled) onSelect(item.key);
      return;
    }
    if (key.escape || input === "q") {
      app.exit();
    }
  });
  return /* @__PURE__ */ jsxs3(Box4, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
    /* @__PURE__ */ jsxs3(Box4, { flexDirection: "column", marginBottom: 1, children: [
      /* @__PURE__ */ jsx4(Text3, { color: palette.accent, children: "argus" }),
      /* @__PURE__ */ jsx4(Text3, { color: palette.dim, children: "magento 2 graphql \xB7 the hundred-eyed watcher" })
    ] }),
    ITEMS.map((item, i) => {
      const prev = ITEMS[i - 1];
      const showSeparator = prev && prev.group !== item.group;
      return /* @__PURE__ */ jsxs3(React3.Fragment, { children: [
        showSeparator ? /* @__PURE__ */ jsx4(Box4, { height: 1 }) : null,
        /* @__PURE__ */ jsx4(MenuRow, { item, active: i === cursor })
      ] }, item.key);
    }),
    /* @__PURE__ */ jsx4(Box4, { marginTop: 1, children: /* @__PURE__ */ jsx4(Text3, { color: palette.dim, children: "\u2191\u2193 move    \u21B5 select    esc quit" }) })
  ] });
}
function MenuRow({ item, active }) {
  const labelColor = !item.enabled ? palette.dim : active ? palette.accent : palette.fg;
  return /* @__PURE__ */ jsxs3(Box4, { children: [
    /* @__PURE__ */ jsx4(Box4, { width: 2, children: /* @__PURE__ */ jsx4(Text3, { color: palette.accent, children: active ? "\u203A" : " " }) }),
    /* @__PURE__ */ jsx4(Box4, { width: 20, children: /* @__PURE__ */ jsx4(Text3, { color: labelColor, children: item.label }) }),
    item.hint ? /* @__PURE__ */ jsx4(Text3, { color: palette.dim, children: item.hint }) : null
  ] });
}
function prevEnabled(idx) {
  for (let i = idx - 1; i >= 0; i--) {
    if (ITEMS[i]?.enabled) return i;
  }
  for (let i = ITEMS.length - 1; i > idx; i--) {
    if (ITEMS[i]?.enabled) return i;
  }
  return idx;
}
function nextEnabled(idx) {
  for (let i = idx + 1; i < ITEMS.length; i++) {
    if (ITEMS[i]?.enabled) return i;
  }
  for (let i = 0; i < idx; i++) {
    if (ITEMS[i]?.enabled) return i;
  }
  return idx;
}

// src/modes/blitzkrieg/index.tsx
import { useCallback, useEffect as useEffect3, useState as useState7 } from "react";
import { Box as Box13, Text as Text12, useApp as useApp3, useInput as useInput6 } from "ink";

// src/modes/blitzkrieg/views/email.tsx
import { useState as useState4 } from "react";
import { Box as Box5, Text as Text4, useInput as useInput3 } from "ink";

// src/modes/blitzkrieg/machine.ts
var initialBlitzState = (defaultStore = "") => ({
  step: "email",
  email: "",
  store: defaultStore,
  emailError: null,
  acquireError: null,
  customer: { status: "loading" },
  cartSummary: { status: "loading" },
  cartDetail: { status: "loading" }
});
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(s) {
  return EMAIL_RE.test(s.trim());
}

// src/modes/blitzkrieg/views/email.tsx
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function EmailView({ initial, onSubmit, onCancel }) {
  const [value, setValue] = useState4(initial);
  const [error, setError] = useState4(null);
  useInput3((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      const trimmed = value.trim();
      if (!isValidEmail(trimmed)) {
        setError("invalid address");
        return;
      }
      onSubmit(trimmed);
      return;
    }
    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
      setError(null);
      return;
    }
    if (key.ctrl || key.meta) return;
    if (input) {
      setValue((v) => v + input);
      setError(null);
    }
  });
  return /* @__PURE__ */ jsxs4(Box5, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
    /* @__PURE__ */ jsx5(Text4, { color: palette.dim, children: "blitzkrieg   step 1 of 2   customer email" }),
    /* @__PURE__ */ jsxs4(Box5, { marginTop: 1, children: [
      /* @__PURE__ */ jsx5(Text4, { color: palette.accent, children: "\u203A " }),
      /* @__PURE__ */ jsx5(Text4, { color: palette.fg, children: value }),
      /* @__PURE__ */ jsx5(Text4, { color: palette.accent, children: "\u258C" })
    ] }),
    /* @__PURE__ */ jsx5(Box5, { marginTop: 1, children: error ? /* @__PURE__ */ jsx5(Text4, { color: palette.error, children: error }) : /* @__PURE__ */ jsx5(Text4, { color: palette.dim, children: "\u21B5 continue    esc cancel" }) })
  ] });
}

// src/modes/blitzkrieg/views/store.tsx
import { useState as useState5 } from "react";
import { Box as Box6, Text as Text5, useInput as useInput4 } from "ink";
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
function StoreView({ initial, onSubmit, onBack }) {
  const [value, setValue] = useState5(initial);
  useInput4((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (key.return) {
      const v = value.trim().length > 0 ? value.trim() : "default";
      onSubmit(v);
      return;
    }
    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
      return;
    }
    if (key.ctrl || key.meta) return;
    if (input) setValue((v) => v + input);
  });
  return /* @__PURE__ */ jsxs5(Box6, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
    /* @__PURE__ */ jsx6(Text5, { color: palette.dim, children: "blitzkrieg   step 2 of 2   store code" }),
    /* @__PURE__ */ jsxs5(Box6, { marginTop: 1, children: [
      /* @__PURE__ */ jsx6(Text5, { color: palette.accent, children: "\u203A " }),
      /* @__PURE__ */ jsx6(Text5, { color: palette.fg, children: value || "" }),
      /* @__PURE__ */ jsx6(Text5, { color: palette.accent, children: "\u258C" })
    ] }),
    /* @__PURE__ */ jsx6(Box6, { marginTop: 1, children: /* @__PURE__ */ jsx6(Text5, { color: palette.dim, children: value.length === 0 ? "empty resolves to \u201Cdefault\u201D" : " " }) }),
    /* @__PURE__ */ jsx6(Text5, { color: palette.dim, children: "\u21B5 continue    esc back" })
  ] });
}

// src/modes/blitzkrieg/views/acquiring.tsx
import { Box as Box7, Text as Text6, useInput as useInput5 } from "ink";
import Spinner2 from "ink-spinner";
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
function AcquiringView({ email, store, error, onRetry, onBack }) {
  useInput5((input) => {
    if (!error) return;
    if (input === "r") onRetry();
    else if (input === "b") onBack();
  });
  if (error) {
    return /* @__PURE__ */ jsxs6(Box7, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
      /* @__PURE__ */ jsx7(Text6, { color: palette.error, children: "token acquisition failed" }),
      /* @__PURE__ */ jsx7(Box7, { marginTop: 1, children: /* @__PURE__ */ jsx7(Text6, { color: palette.fg, children: error }) }),
      /* @__PURE__ */ jsx7(Box7, { marginTop: 1, children: /* @__PURE__ */ jsxs6(Text6, { color: palette.dim, children: [
        "email ",
        email,
        "    store ",
        store
      ] }) }),
      /* @__PURE__ */ jsx7(Box7, { marginTop: 1, children: /* @__PURE__ */ jsx7(Text6, { color: palette.dim, children: "r retry    b back" }) })
    ] });
  }
  return /* @__PURE__ */ jsxs6(Box7, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
    /* @__PURE__ */ jsxs6(Box7, { children: [
      /* @__PURE__ */ jsx7(Text6, { color: palette.accent, children: /* @__PURE__ */ jsx7(Spinner2, { type: "dots" }) }),
      /* @__PURE__ */ jsx7(Text6, { color: palette.fg, children: " acquiring token" })
    ] }),
    /* @__PURE__ */ jsxs6(Text6, { color: palette.dim, children: [
      "email ",
      email,
      "    store ",
      store
    ] })
  ] });
}

// src/modes/blitzkrieg/views/snapshot.tsx
import { Box as Box9, Text as Text8 } from "ink";
import Spinner3 from "ink-spinner";

// src/ui/log-strip.tsx
import { useEffect as useEffect2, useState as useState6 } from "react";
import { Box as Box8, Text as Text7 } from "ink";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
function LogStrip({ title = "log", limit = 8 }) {
  const [entries, setEntries] = useState6(() => getLog(limit));
  useEffect2(() => subscribe(() => setEntries(getLog(limit))), [limit]);
  return /* @__PURE__ */ jsxs7(Box8, { flexDirection: "column", paddingX: 2, marginTop: 1, children: [
    /* @__PURE__ */ jsx8(Text7, { color: palette.dim, children: title }),
    entries.length === 0 ? /* @__PURE__ */ jsx8(Text7, { color: palette.dim, children: "(no requests yet)" }) : entries.map((e, i) => /* @__PURE__ */ jsx8(LogRow, { entry: e }, `${e.ts}-${i}`))
  ] });
}
function LogRow({ entry }) {
  const ok = entry.status >= 200 && entry.status < 300 && entry.errorCount === 0;
  const tone = ok ? palette.success : palette.error;
  const icon = ok ? "\u2713" : "\u2717";
  const stamp = formatTime(entry.ts);
  const status = entry.status === 0 ? "ERR" : String(entry.status);
  return /* @__PURE__ */ jsxs7(Box8, { children: [
    /* @__PURE__ */ jsx8(Box8, { width: 2, children: /* @__PURE__ */ jsx8(Text7, { color: tone, children: icon }) }),
    /* @__PURE__ */ jsx8(Box8, { width: 13, children: /* @__PURE__ */ jsx8(Text7, { color: palette.dim, children: stamp }) }),
    /* @__PURE__ */ jsx8(Box8, { width: 32, children: /* @__PURE__ */ jsx8(Text7, { color: palette.fg, children: entry.op }) }),
    /* @__PURE__ */ jsx8(Box8, { width: 6, children: /* @__PURE__ */ jsx8(Text7, { color: palette.dim, children: status }) }),
    /* @__PURE__ */ jsx8(Box8, { width: 9, children: /* @__PURE__ */ jsxs7(Text7, { color: palette.dim, children: [
      entry.ms,
      "ms"
    ] }) }),
    entry.firstError ? /* @__PURE__ */ jsx8(Text7, { color: palette.error, wrap: "truncate-end", children: entry.firstError }) : null
  ] });
}
function formatTime(ts) {
  const d = new Date(ts);
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}
function pad2(n) {
  return n.toString().padStart(2, "0");
}

// src/modes/blitzkrieg/views/snapshot.tsx
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
function SnapshotView({ state }) {
  return /* @__PURE__ */ jsxs8(Box9, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
    /* @__PURE__ */ jsx9(Text8, { color: palette.dim, children: "gathering snapshot" }),
    /* @__PURE__ */ jsxs8(Box9, { marginTop: 1, flexDirection: "column", children: [
      /* @__PURE__ */ jsx9(Row, { label: "customer + addresses", status: state.customer.status, message: messageOf(state.customer) }),
      /* @__PURE__ */ jsx9(Row, { label: "cart summary", status: state.cartSummary.status, message: messageOf(state.cartSummary) }),
      /* @__PURE__ */ jsx9(Row, { label: "cart detail", status: state.cartDetail.status, message: messageOf(state.cartDetail) })
    ] }),
    /* @__PURE__ */ jsx9(LogStrip, {})
  ] });
}
function Row({
  label,
  status,
  message
}) {
  return /* @__PURE__ */ jsxs8(Box9, { children: [
    /* @__PURE__ */ jsx9(Box9, { width: 3, children: status === "loading" ? /* @__PURE__ */ jsx9(Text8, { color: palette.accent, children: /* @__PURE__ */ jsx9(Spinner3, { type: "dots" }) }) : status === "ok" ? /* @__PURE__ */ jsx9(Text8, { color: palette.success, children: "\u2713" }) : /* @__PURE__ */ jsx9(Text8, { color: palette.error, children: "\u2717" }) }),
    /* @__PURE__ */ jsx9(Box9, { width: 28, children: /* @__PURE__ */ jsx9(Text8, { color: palette.fg, children: label }) }),
    message ? /* @__PURE__ */ jsx9(Text8, { color: status === "error" ? palette.error : palette.dim, children: message }) : null
  ] });
}
function messageOf(s) {
  if (s.status === "error") return s.message ?? "error";
  return null;
}

// src/modes/blitzkrieg/views/results.tsx
import React7 from "react";
import { Box as Box12, Text as Text11, useStdout } from "ink";

// src/ui/panel.tsx
import { Box as Box10, Text as Text9 } from "ink";
import { jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
function Panel({
  title,
  tone = "default",
  flexGrow,
  width,
  children
}) {
  const titleColor = tone === "error" ? palette.error : tone === "warn" ? palette.warn : tone === "success" ? palette.success : palette.dim;
  return /* @__PURE__ */ jsxs9(Box10, { flexDirection: "column", flexGrow, width, paddingX: 2, marginBottom: 1, children: [
    title ? /* @__PURE__ */ jsx10(Box10, { marginBottom: 1, children: /* @__PURE__ */ jsx10(Text9, { color: titleColor, children: title }) }) : null,
    children
  ] });
}

// src/ui/table.tsx
import { Box as Box11, Text as Text10 } from "ink";
import { jsx as jsx11, jsxs as jsxs10 } from "react/jsx-runtime";
function Table({ columns, rows, empty }) {
  if (rows.length === 0) {
    return /* @__PURE__ */ jsx11(Text10, { color: palette.dim, children: empty ?? "\u2014" });
  }
  return /* @__PURE__ */ jsxs10(Box11, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx11(Box11, { children: columns.map((c, i) => /* @__PURE__ */ jsx11(Box11, { width: c.width, marginRight: i === columns.length - 1 ? 0 : 1, children: /* @__PURE__ */ jsx11(Text10, { color: palette.dim, children: c.header.toUpperCase() }) }, i)) }),
    rows.map((row, ri) => /* @__PURE__ */ jsx11(Box11, { children: columns.map((c, ci) => /* @__PURE__ */ jsx11(Box11, { width: c.width, marginRight: ci === columns.length - 1 ? 0 : 1, children: /* @__PURE__ */ jsx11(Text10, { color: palette.fg, wrap: "truncate-end", children: c.render(row) }) }, ci)) }, ri))
  ] });
}

// src/modes/blitzkrieg/views/results.tsx
import { jsx as jsx12, jsxs as jsxs11 } from "react/jsx-runtime";
function ResultsView({ state }) {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const wide = cols >= 140;
  const direction = wide ? "row" : "column";
  return /* @__PURE__ */ jsxs11(Box12, { flexDirection: "column", paddingY: 1, children: [
    /* @__PURE__ */ jsxs11(Box12, { flexDirection: direction, children: [
      /* @__PURE__ */ jsx12(CustomerPanel, { state: state.customer, wide }),
      /* @__PURE__ */ jsx12(CartSummaryPanel, { state: state.cartSummary, wide })
    ] }),
    /* @__PURE__ */ jsx12(CartDetailPanel, { state: state.cartDetail }),
    /* @__PURE__ */ jsx12(Box12, { paddingX: 2, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "r refresh    c cart-id    t token    l log    j dump    b back    q quit" }) })
  ] });
}
function field(label, value) {
  return /* @__PURE__ */ jsxs11(Box12, { children: [
    /* @__PURE__ */ jsx12(Box12, { width: 14, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: label }) }),
    /* @__PURE__ */ jsx12(Text11, { color: palette.fg, children: value })
  ] });
}
function CustomerPanel({ state, wide }) {
  const flexGrow = wide ? 1 : void 0;
  if (state.status === "loading") {
    return /* @__PURE__ */ jsx12(Panel, { title: "customer", flexGrow, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "loading\u2026" }) });
  }
  if (state.status === "error") {
    return /* @__PURE__ */ jsx12(Panel, { title: "customer", tone: "error", flexGrow, children: /* @__PURE__ */ jsx12(Text11, { color: palette.error, children: state.message }) });
  }
  const c = state.data;
  if (!c) {
    return /* @__PURE__ */ jsx12(Panel, { title: "customer", flexGrow, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "no customer payload" }) });
  }
  const name = [c.firstname, c.lastname].filter(Boolean).join(" ") || "\u2014";
  const addrs = c.addresses ?? [];
  const phones = collectPhones(addrs);
  return /* @__PURE__ */ jsxs11(Panel, { title: "customer", flexGrow, children: [
    field("name", name),
    field("email", c.email ?? "\u2014"),
    /* @__PURE__ */ jsx12(PhonesField, { phones }),
    /* @__PURE__ */ jsx12(Box12, { marginTop: 1, children: /* @__PURE__ */ jsxs11(Text11, { color: palette.dim, children: [
      "addresses (",
      addrs.length,
      ")"
    ] }) }),
    addrs.length === 0 ? /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "\u2014" }) : addrs.map((a, i) => /* @__PURE__ */ jsxs11(Box12, { flexDirection: "column", marginTop: 1, children: [
      /* @__PURE__ */ jsxs11(Box12, { children: [
        /* @__PURE__ */ jsx12(Text11, { color: palette.fg, children: [a.firstname, a.lastname].filter(Boolean).join(" ") || "\u2014" }),
        a.default_billing || a.default_shipping ? /* @__PURE__ */ jsxs11(Text11, { color: palette.accent, children: [
          "  ",
          a.default_billing ? "billing " : "",
          a.default_shipping ? "shipping" : ""
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxs11(Text11, { color: palette.dim, children: [
        (a.street ?? []).join(", "),
        " \xB7 ",
        a.city ?? "\u2014",
        " ",
        a.postcode ?? "",
        " \xB7 ",
        a.country_code ?? "\u2014"
      ] }),
      a.region?.region ? /* @__PURE__ */ jsxs11(Text11, { color: palette.dim, children: [
        a.region.region,
        " (",
        a.region.region_code ?? "\u2014",
        ")"
      ] }) : null,
      a.telephone ? /* @__PURE__ */ jsxs11(Text11, { color: phoneLooksValid(a.telephone) ? palette.dim : palette.warn, children: [
        "phone ",
        a.telephone,
        phoneLooksValid(a.telephone) ? "" : "  \u26A0 looks invalid"
      ] }) : /* @__PURE__ */ jsx12(Text11, { color: palette.warn, children: "phone \u2014  \u26A0 missing" })
    ] }, a.id ?? i))
  ] });
}
function collectPhones(addrs) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const a of addrs ?? []) {
    const raw = (a.telephone ?? "").trim();
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);
    out.push({ raw, valid: phoneLooksValid(raw) });
  }
  return out;
}
function PhonesField({ phones }) {
  if (phones.length === 0) {
    return /* @__PURE__ */ jsxs11(Box12, { children: [
      /* @__PURE__ */ jsx12(Box12, { width: 14, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "phones" }) }),
      /* @__PURE__ */ jsx12(Text11, { color: palette.warn, children: "\u2014   \u26A0 no phone on any address" })
    ] });
  }
  return /* @__PURE__ */ jsx12(Box12, { flexDirection: "column", children: phones.map((p, i) => /* @__PURE__ */ jsxs11(Box12, { children: [
    /* @__PURE__ */ jsx12(Box12, { width: 14, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: i === 0 ? "phones" : "" }) }),
    /* @__PURE__ */ jsxs11(Text11, { color: p.valid ? palette.fg : palette.warn, children: [
      p.raw,
      p.valid ? "" : "   \u26A0 looks invalid"
    ] })
  ] }, `${p.raw}-${i}`)) });
}
function phoneLooksValid(raw) {
  if (!raw) return false;
  const stripped = raw.replace(/[\s\-().]/g, "");
  const optionalPlus = stripped.startsWith("+") ? stripped.slice(1) : stripped;
  if (!/^[0-9]+$/.test(optionalPlus)) return false;
  return optionalPlus.length >= 7 && optionalPlus.length <= 15;
}
function CartSummaryPanel({ state, wide }) {
  const flexGrow = wide ? 1 : void 0;
  if (state.status === "loading") {
    return /* @__PURE__ */ jsx12(Panel, { title: "cart summary", flexGrow, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "loading\u2026" }) });
  }
  if (state.status === "error") {
    return /* @__PURE__ */ jsx12(Panel, { title: "cart summary", tone: "error", flexGrow, children: /* @__PURE__ */ jsx12(Text11, { color: palette.error, children: state.message }) });
  }
  const c = state.data;
  if (!c) {
    return /* @__PURE__ */ jsx12(Panel, { title: "cart summary", flexGrow, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "no cart" }) });
  }
  return /* @__PURE__ */ jsxs11(Panel, { title: "cart summary", flexGrow, children: [
    field("id", c.id),
    field("items", String(c.total_quantity ?? 0)),
    field("grand total", formatMoney(c.prices?.grand_total ?? null))
  ] });
}
function CartDetailPanel({ state }) {
  if (state.status === "loading") {
    return /* @__PURE__ */ jsx12(Panel, { title: "cart detail", children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "loading\u2026" }) });
  }
  if (state.status === "error") {
    return /* @__PURE__ */ jsx12(Panel, { title: "cart detail", tone: "error", children: /* @__PURE__ */ jsx12(Text11, { color: palette.error, children: state.message }) });
  }
  const c = state.data;
  if (!c) {
    return /* @__PURE__ */ jsx12(Panel, { title: "cart detail", children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "no cart" }) });
  }
  const items = c.items ?? [];
  const taxes = c.prices?.applied_taxes ?? [];
  const coupons = c.applied_coupons ?? [];
  const ship = c.shipping_addresses?.[0];
  const bill = c.billing_address;
  const pay = c.selected_payment_method;
  return /* @__PURE__ */ jsxs11(Panel, { title: "cart detail", children: [
    /* @__PURE__ */ jsx12(Box12, { marginBottom: 1, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "items" }) }),
    /* @__PURE__ */ jsx12(
      Table,
      {
        columns: [
          { header: "sku", width: 18, render: (r) => r.product?.sku ?? "\u2014" },
          { header: "name", width: 40, render: (r) => r.product?.name ?? "\u2014" },
          { header: "qty", width: 5, render: (r) => String(r.quantity ?? 0) },
          { header: "row total", width: 14, render: (r) => formatMoney(r.prices?.row_total ?? null) }
        ],
        rows: items,
        empty: "no items"
      }
    ),
    /* @__PURE__ */ jsx12(Box12, { marginTop: 1, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "shipping" }) }),
    ship ? /* @__PURE__ */ jsxs11(Box12, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx12(Text11, { color: palette.fg, children: [ship.firstname, ship.lastname].filter(Boolean).join(" ") || "\u2014" }),
      /* @__PURE__ */ jsxs11(Text11, { color: palette.dim, children: [
        (ship.street ?? []).join(", "),
        " \xB7 ",
        ship.city ?? "\u2014",
        " ",
        ship.postcode ?? "",
        " \xB7 ",
        ship.country?.code ?? "\u2014"
      ] }),
      ship.selected_shipping_method ? /* @__PURE__ */ jsxs11(Text11, { color: palette.dim, children: [
        ship.selected_shipping_method.carrier_code ?? "\u2014",
        " / ",
        ship.selected_shipping_method.method_code ?? "\u2014",
        " \xB7",
        " ",
        formatMoney(ship.selected_shipping_method.amount)
      ] }) : /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "no shipping method selected" })
    ] }) : /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "no shipping address" }),
    /* @__PURE__ */ jsx12(Box12, { marginTop: 1, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "billing" }) }),
    bill ? /* @__PURE__ */ jsxs11(Box12, { flexDirection: "column", children: [
      /* @__PURE__ */ jsx12(Text11, { color: palette.fg, children: [bill.firstname, bill.lastname].filter(Boolean).join(" ") || "\u2014" }),
      /* @__PURE__ */ jsxs11(Text11, { color: palette.dim, children: [
        (bill.street ?? []).join(", "),
        " \xB7 ",
        bill.city ?? "\u2014",
        " ",
        bill.postcode ?? ""
      ] })
    ] }) : /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "no billing address" }),
    /* @__PURE__ */ jsxs11(Box12, { marginTop: 1, flexDirection: "column", children: [
      field("coupons", coupons.length === 0 ? "\u2014" : coupons.map((c2) => c2.code).join(", ")),
      field("payment", pay?.title ?? pay?.code ?? "\u2014")
    ] }),
    /* @__PURE__ */ jsx12(Box12, { marginTop: 1, children: /* @__PURE__ */ jsx12(Text11, { color: palette.dim, children: "totals" }) }),
    field("subtotal", formatMoney(c.prices?.subtotal_excluding_tax ?? null)),
    taxes.map((t, i) => /* @__PURE__ */ jsx12(React7.Fragment, { children: field(t.label ?? "tax", formatMoney(t.amount ?? null)) }, i)),
    field("grand total", formatMoney(c.prices?.grand_total ?? null))
  ] });
}
function formatMoney(m) {
  if (!m || m.value == null) return "\u2014";
  const v = m.value;
  const c = m.currency ?? "";
  return `${v.toFixed(2)} ${c}`.trim();
}

// src/graphql/operations/customer-token-as-admin.ts
var GENERATE_CUSTOMER_TOKEN_AS_ADMIN = (
  /* GraphQL */
  `
  mutation ArgusGenerateCustomerTokenAsAdmin($email: String!) {
    generateCustomerTokenAsAdmin(input: { customer_email: $email }) {
      customer_token
    }
  }
`
);

// src/graphql/operations/customer-addresses.ts
var CUSTOMER_ADDRESSES_QUERY = (
  /* GraphQL */
  `
  query ArgusCustomerAddresses {
    customer {
      firstname
      lastname
      email
      addresses {
        id
        firstname
        lastname
        street
        city
        region {
          region
          region_code
        }
        postcode
        country_code
        telephone
        default_billing
        default_shipping
      }
    }
  }
`
);

// src/graphql/operations/customer-cart-summary.ts
var CUSTOMER_CART_SUMMARY_QUERY = (
  /* GraphQL */
  `
  query ArgusCartSummary {
    customerCart {
      id
      total_quantity
      prices {
        grand_total {
          value
          currency
        }
      }
    }
  }
`
);

// src/graphql/operations/customer-cart-detail.ts
var CUSTOMER_CART_DETAIL_QUERY = (
  /* GraphQL */
  `
  query ArgusCartDetail {
    customerCart {
      id
      items {
        uid
        quantity
        product {
          sku
          name
          url_key
        }
        prices {
          row_total {
            value
            currency
          }
        }
      }
      shipping_addresses {
        firstname
        lastname
        street
        city
        postcode
        country {
          code
        }
        selected_shipping_method {
          carrier_code
          method_code
          amount {
            value
            currency
          }
        }
      }
      billing_address {
        firstname
        lastname
        street
        city
        postcode
      }
      applied_coupons {
        code
      }
      prices {
        subtotal_excluding_tax {
          value
          currency
        }
        grand_total {
          value
          currency
        }
        applied_taxes {
          label
          amount {
            value
            currency
          }
        }
      }
      selected_payment_method {
        code
        title
      }
    }
  }
`
);

// src/modes/blitzkrieg/runner.ts
async function acquireCustomerToken(email, store) {
  setStoreCode(store);
  setCustomerEmail(email);
  const res = await call({
    query: GENERATE_CUSTOMER_TOKEN_AS_ADMIN,
    variables: { email },
    operationName: "ArgusGenerateCustomerTokenAsAdmin",
    authMode: "admin",
    storeCode: store
  });
  if (res.errors && res.errors.length > 0) {
    return { ok: false, reason: res.errors.map((e) => e.message).join(" \xB7 ") };
  }
  const token = res.data?.generateCustomerTokenAsAdmin?.customer_token;
  if (!token) {
    return { ok: false, reason: `no token returned (status ${res.status})` };
  }
  setCustomerToken(token);
  return { ok: true, token };
}
async function runSnapshot(store) {
  const [customer, summary, detail] = await Promise.allSettled([
    call({
      query: CUSTOMER_ADDRESSES_QUERY,
      operationName: "ArgusCustomerAddresses",
      authMode: "customer",
      storeCode: store
    }),
    call({
      query: CUSTOMER_CART_SUMMARY_QUERY,
      operationName: "ArgusCartSummary",
      authMode: "customer",
      storeCode: store
    }),
    call({
      query: CUSTOMER_CART_DETAIL_QUERY,
      operationName: "ArgusCartDetail",
      authMode: "customer",
      storeCode: store
    })
  ]);
  return {
    customer: extract(customer, (d) => d.customer ?? null),
    cartSummary: extract(summary, (d) => d.customerCart ?? null),
    cartDetail: extract(detail, (d) => d.customerCart ?? null)
  };
}
function extract(settled, pick) {
  if (settled.status === "rejected") {
    return { ok: false, message: settled.reason instanceof Error ? settled.reason.message : String(settled.reason) };
  }
  const v = settled.value;
  if (v.errors && v.errors.length > 0) {
    return { ok: false, message: v.errors.map((e) => e.message).join(" \xB7 ") };
  }
  if (!v.data) {
    return { ok: false, message: `empty payload (status ${v.status})` };
  }
  return { ok: true, data: pick(v.data) };
}

// src/util/json-dump.ts
import { mkdirSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import { join as join2, resolve } from "path";

// src/session/redact.ts
var REDACTED = "\xABredacted\xBB";
var SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /authorization/i,
  /admin[_-]?key/i,
  /password/i,
  /secret/i,
  /bearer/i,
  /api[_-]?key/i
];
function redact(input) {
  return walk(input);
}
function walk(value) {
  if (value === null || value === void 0) return value;
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(walk);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
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
function redactString(s) {
  const session2 = getSession();
  let out = s;
  if (session2.adminKey && session2.adminKey.length > 0) {
    out = replaceAll(out, session2.adminKey, REDACTED);
  }
  if (session2.customerToken && session2.customerToken.length > 0) {
    out = replaceAll(out, session2.customerToken, REDACTED);
  }
  out = out.replace(/Bearer\s+[A-Za-z0-9._\-]+/g, `Bearer ${REDACTED}`);
  return out;
}
function replaceAll(haystack, needle, repl) {
  if (!needle) return haystack;
  return haystack.split(needle).join(repl);
}

// src/util/clock.ts
function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor(totalSeconds % 3600 / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}
function isoTimestampSafe(date = /* @__PURE__ */ new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

// src/util/json-dump.ts
function writeSnapshot(opts) {
  const cwd = opts.cwd ?? process.cwd();
  const dir = resolve(cwd, "argus-snapshots");
  mkdirSync(dir, { recursive: true });
  const stamp = isoTimestampSafe();
  const hash = createHash("sha1").update(opts.email).digest("hex").slice(0, 8);
  const file = join2(dir, `${stamp}__${hash}.json`);
  const sanitised = redact(opts.payload);
  writeFileSync(file, JSON.stringify(sanitised, null, 2), { encoding: "utf8", mode: 384 });
  return file;
}

// src/util/clipboard.ts
import { spawn } from "child_process";
function candidates() {
  const platform = process.platform;
  if (platform === "darwin") {
    return [{ cmd: "pbcopy", args: [] }];
  }
  if (platform === "win32") {
    return [{ cmd: "clip", args: [] }];
  }
  if (process.env.WAYLAND_DISPLAY) {
    return [
      { cmd: "wl-copy", args: [] },
      { cmd: "xclip", args: ["-selection", "clipboard"] },
      { cmd: "xsel", args: ["--clipboard", "--input"] }
    ];
  }
  return [
    { cmd: "xclip", args: ["-selection", "clipboard"] },
    { cmd: "xsel", args: ["--clipboard", "--input"] },
    { cmd: "wl-copy", args: [] }
  ];
}
async function copyToClipboard(text) {
  for (const c of candidates()) {
    const ok = await tryWrite(c, text);
    if (ok) return { ok: true, tool: c.cmd };
  }
  return { ok: false, reason: "no clipboard tool found" };
}
function tryWrite(c, text) {
  return new Promise((resolve2) => {
    let proc;
    try {
      proc = spawn(c.cmd, c.args, { stdio: ["pipe", "ignore", "ignore"] });
    } catch {
      resolve2(false);
      return;
    }
    proc.on("error", () => resolve2(false));
    proc.on("close", (code) => resolve2(code === 0));
    proc.stdin?.end(text);
  });
}

// src/modes/blitzkrieg/index.tsx
import { jsx as jsx13, jsxs as jsxs12 } from "react/jsx-runtime";
function Blitzkrieg({ defaultStore, onExit }) {
  const app = useApp3();
  const [state, setState] = useState7(() => initialBlitzState(defaultStore));
  const [toast, setToast] = useState7(null);
  const [showLog, setShowLog] = useState7(false);
  const goEmail = useCallback(() => {
    clearModeState();
    setState(initialBlitzState(defaultStore));
  }, [defaultStore]);
  const handleEmail = useCallback(
    (email) => {
      setState((s) => ({ ...s, email, step: "store" }));
    },
    []
  );
  const handleStore = useCallback((store) => {
    setState((s) => ({ ...s, store, step: "acquiring", acquireError: null }));
  }, []);
  const handleAcquire = useCallback(
    async (email, store) => {
      const outcome = await acquireCustomerToken(email, store);
      if (!outcome.ok) {
        setState((s) => ({ ...s, step: "acquiring", acquireError: outcome.reason }));
        return;
      }
      setState((s) => ({
        ...s,
        step: "snapshot",
        customer: { status: "loading" },
        cartSummary: { status: "loading" },
        cartDetail: { status: "loading" }
      }));
      const t0 = Date.now();
      const results = await runSnapshot(store);
      setState((s) => ({
        ...s,
        step: "results",
        customer: results.customer.ok ? { status: "ok", data: results.customer.data, fetchedAt: t0 } : { status: "error", message: results.customer.message, fetchedAt: t0 },
        cartSummary: results.cartSummary.ok ? { status: "ok", data: results.cartSummary.data, fetchedAt: t0 } : { status: "error", message: results.cartSummary.message, fetchedAt: t0 },
        cartDetail: results.cartDetail.ok ? { status: "ok", data: results.cartDetail.data, fetchedAt: t0 } : { status: "error", message: results.cartDetail.message, fetchedAt: t0 }
      }));
    },
    []
  );
  useEffect3(() => {
    if (state.step === "acquiring" && !state.acquireError) {
      void handleAcquire(state.email, state.store);
    }
  }, [state.step, state.acquireError, state.email, state.store, handleAcquire]);
  useEffect3(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(t);
  }, [toast]);
  useInput6(
    (input, key) => {
      if (state.step !== "results") return;
      if (input === "q") {
        clearModeState();
        app.exit();
        return;
      }
      if (input === "b" || key.escape) {
        clearModeState();
        onExit();
        return;
      }
      if (input === "r") {
        setState((s) => ({ ...s, step: "acquiring", acquireError: null }));
        return;
      }
      if (input === "c") {
        const cartId = state.cartDetail.status === "ok" ? state.cartDetail.data?.id : state.cartSummary.status === "ok" ? state.cartSummary.data?.id : null;
        if (!cartId) {
          setToast({ tone: "error", message: "no cart id" });
          return;
        }
        void copyToClipboard(cartId).then((res) => {
          if (res.ok) setToast({ tone: "success", message: `cart-id copied via ${res.tool}` });
          else setToast({ tone: "error", message: `copy failed: ${res.reason} \xB7 cart-id ${cartId}` });
        });
        return;
      }
      if (input === "t") {
        const tok = getSession().customerToken;
        if (!tok) {
          setToast({ tone: "error", message: "no customer token in session" });
          return;
        }
        void copyToClipboard(tok).then((res) => {
          if (res.ok) setToast({ tone: "success", message: `customer token copied via ${res.tool}` });
          else setToast({ tone: "error", message: `copy failed: ${res.reason}` });
        });
        return;
      }
      if (input === "l") {
        setShowLog((v) => !v);
        return;
      }
      if (input === "j") {
        try {
          const file = writeSnapshot({
            email: state.email,
            payload: {
              email: state.email,
              store: state.store,
              capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
              customer: state.customer.status === "ok" ? state.customer.data : { error: errOf(state.customer) },
              cartSummary: state.cartSummary.status === "ok" ? state.cartSummary.data : { error: errOf(state.cartSummary) },
              cartDetail: state.cartDetail.status === "ok" ? state.cartDetail.data : { error: errOf(state.cartDetail) }
            }
          });
          setToast({ tone: "success", message: `dumped \u2192 ${file}` });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setToast({ tone: "error", message: `dump failed: ${msg}` });
        }
      }
    },
    { isActive: state.step === "results" }
  );
  return /* @__PURE__ */ jsxs12(Box13, { flexDirection: "column", children: [
    /* @__PURE__ */ jsxs12(Box13, { flexDirection: "column", children: [
      state.step === "email" && /* @__PURE__ */ jsx13(
        EmailView,
        {
          initial: state.email,
          onSubmit: handleEmail,
          onCancel: () => {
            clearModeState();
            onExit();
          }
        }
      ),
      state.step === "store" && /* @__PURE__ */ jsx13(StoreView, { initial: state.store || defaultStore, onSubmit: handleStore, onBack: goEmail }),
      state.step === "acquiring" && /* @__PURE__ */ jsx13(
        AcquiringView,
        {
          email: state.email,
          store: state.store,
          error: state.acquireError,
          onRetry: () => setState((s) => ({ ...s, acquireError: null })),
          onBack: () => {
            clearModeState();
            setState(initialBlitzState(defaultStore));
          }
        }
      ),
      state.step === "snapshot" && /* @__PURE__ */ jsx13(SnapshotView, { state }),
      state.step === "results" && /* @__PURE__ */ jsx13(ResultsView, { state }),
      state.step === "results" && showLog ? /* @__PURE__ */ jsx13(LogStrip, {}) : null
    ] }, state.step),
    toast ? /* @__PURE__ */ jsx13(Box13, { paddingX: 2, children: /* @__PURE__ */ jsxs12(Text12, { color: toast.tone === "success" ? palette.success : palette.error, children: [
      toast.tone === "success" ? "\u2713" : "\u2717",
      " ",
      toast.message
    ] }) }) : null
  ] });
}
function errOf(state) {
  return state.status === "error" ? state.message ?? "error" : "incomplete";
}

// src/ui/status-bar.tsx
import { useEffect as useEffect4, useState as useState8 } from "react";
import { Box as Box14, Text as Text13, useStdout as useStdout2 } from "ink";
import { jsx as jsx14 } from "react/jsx-runtime";
var VERSION = "0.1.0";
function StatusBar() {
  const [, force] = useState8(0);
  const { stdout } = useStdout2();
  const cols = stdout?.columns ?? 80;
  useEffect4(() => {
    const t = setInterval(() => force((n) => n + 1), motion.statusTickMs);
    return () => clearInterval(t);
  }, []);
  const session2 = getSession();
  const adminMask = session2.adminKey ? "\u25CF\u25CF\u25CF\u25CF" : "\u2014";
  const store = session2.storeCode ?? "\u2014";
  const elapsed = formatElapsed(sessionElapsedSeconds());
  const host = truncate(session2.endpointHost || "\u2014", Math.max(8, Math.floor(cols * 0.25)));
  const segments = [
    `argus ${VERSION}`,
    host,
    `admin ${adminMask}`,
    `store ${store}`,
    elapsed
  ];
  return /* @__PURE__ */ jsx14(Box14, { paddingX: 2, children: /* @__PURE__ */ jsx14(Text13, { color: palette.dim, children: segments.join("   ") }) });
}
function truncate(s, max) {
  if (s.length <= max) return s;
  if (max <= 1) return "\u2026";
  return s.slice(0, max - 1) + "\u2026";
}

// src/app.tsx
import { jsx as jsx15, jsxs as jsxs13 } from "react/jsx-runtime";
function App({ initialEndpoint, defaultStoreCode }) {
  const app = useApp4();
  const [stage, setStage] = useState9("splash");
  const showStatus = stage !== "splash" && stage !== "auth";
  const goto = (next) => setStage(next);
  const handleMenu = (k) => {
    if (k === "quit") app.exit();
    else if (k === "blitzkrieg") goto("blitzkrieg");
    else if (k === "settings") goto("settings");
  };
  return /* @__PURE__ */ jsxs13(Box15, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx15(
      StageView,
      {
        stage,
        initialEndpoint,
        defaultStoreCode,
        onAuthReady: () => goto("menu"),
        onSplashDone: () => goto("auth"),
        onMenuSelect: handleMenu,
        onBlitzExit: () => goto("menu"),
        onSettingsBack: () => goto("menu")
      },
      stage
    ),
    showStatus ? /* @__PURE__ */ jsx15(Box15, { marginTop: 1, children: /* @__PURE__ */ jsx15(StatusBar, {}) }) : null
  ] });
}
function StageView(props) {
  switch (props.stage) {
    case "splash":
      return /* @__PURE__ */ jsx15(Splash, { onDone: props.onSplashDone });
    case "auth":
      return /* @__PURE__ */ jsx15(AdminKeyPrompt, { initialEndpoint: props.initialEndpoint, onReady: props.onAuthReady });
    case "menu":
      return /* @__PURE__ */ jsx15(Menu, { onSelect: props.onMenuSelect });
    case "blitzkrieg":
      return /* @__PURE__ */ jsx15(Blitzkrieg, { defaultStore: props.defaultStoreCode, onExit: props.onBlitzExit });
    case "settings":
      return /* @__PURE__ */ jsx15(SettingsStub, { onBack: props.onSettingsBack });
  }
}
function SettingsStub({ onBack }) {
  useInput7((_input, key) => {
    if (key.escape || key.return) onBack();
  });
  return /* @__PURE__ */ jsxs13(Box15, { paddingX: 2, paddingY: 1, flexDirection: "column", children: [
    /* @__PURE__ */ jsx15(Text14, { color: palette.fg, children: "settings \xB7 planned" }),
    /* @__PURE__ */ jsx15(Text14, { color: palette.dim, children: "esc / \u21B5 back" })
  ] });
}

// src/blitz-noninteractive.ts
async function runBlitzNonInteractive(input) {
  if (!isValidEmail(input.email)) {
    emit({ ok: false, stage: "input", error: "invalid email" });
    return 1;
  }
  const adminKey = process.env.ARGUS_ADMIN_KEY;
  if (!adminKey || adminKey.length === 0) {
    emit({ ok: false, stage: "auth", error: "ARGUS_ADMIN_KEY not set" });
    return 4;
  }
  setEndpoint(input.endpoint);
  setAdminKey(adminKey);
  const ping = await call({ query: PING_QUERY, authMode: "admin", storeCode: input.store });
  if (ping.status !== 200 || !ping.data?.storeConfig) {
    emit({
      ok: false,
      stage: "ping",
      status: ping.status,
      errors: ping.errors?.map((e) => e.message) ?? []
    });
    shutdown();
    return 4;
  }
  const acquire = await acquireCustomerToken(input.email, input.store);
  if (!acquire.ok) {
    emit({ ok: false, stage: "token", error: acquire.reason });
    shutdown();
    return 3;
  }
  const snapshot = await runSnapshot(input.store);
  const partial = !snapshot.customer.ok || !snapshot.cartSummary.ok || !snapshot.cartDetail.ok;
  emit({
    ok: !partial,
    stage: "snapshot",
    email: input.email,
    store: input.store,
    capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
    customer: snapshot.customer.ok ? snapshot.customer.data : { error: snapshot.customer.message },
    cartSummary: snapshot.cartSummary.ok ? snapshot.cartSummary.data : { error: snapshot.cartSummary.message },
    cartDetail: snapshot.cartDetail.ok ? snapshot.cartDetail.data : { error: snapshot.cartDetail.message }
  });
  shutdown();
  return partial ? 2 : 0;
}
function emit(payload) {
  process.stdout.write(JSON.stringify(redact(payload)) + "\n");
}

// src/util/terminal.ts
var inAltScreen = false;
function enterAltScreen() {
  if (inAltScreen) return;
  if (!process.stdout.isTTY) return;
  process.stdout.write("\x1B[?1049h\x1B[H\x1B[2J\x1B[3J");
  process.stdout.write("\x1B[?25l");
  inAltScreen = true;
}
function leaveAltScreen() {
  if (!inAltScreen) return;
  process.stdout.write("\x1B[?25h");
  process.stdout.write("\x1B[?1049l");
  inAltScreen = false;
}

// src/cli.tsx
import { jsx as jsx16 } from "react/jsx-runtime";
var VERSION2 = "0.1.0";
var HELP = `argus ${VERSION2} \u2014 Magento 2 frontend GraphQL debug CLI

usage:
  argus                                    interactive TUI
  argus --endpoint <url>                   override endpoint
  argus blitz <email> <store-code>         non-interactive blitzkrieg
  argus --version
  argus --help

env:
  ARGUS_ENDPOINT      graphql endpoint url
  ARGUS_ADMIN_KEY     admin bearer token (required for non-interactive)

config:
  ~/.argusrc.json     { "endpoint", "defaultStoreCode", "timeoutMs" }
`;
function parseArgs(argv) {
  const args = argv.slice(2);
  let endpoint;
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") return { command: "help" };
    if (a === "--version" || a === "-v") return { command: "version" };
    if (a === "--endpoint") {
      endpoint = args[i + 1];
      i++;
      continue;
    }
    if (a.startsWith("--endpoint=")) {
      endpoint = a.slice("--endpoint=".length);
      continue;
    }
    positional.push(a);
  }
  if (positional[0] === "blitz") {
    return {
      command: "blitz",
      ...endpoint ? { endpoint } : {},
      ...positional[1] !== void 0 ? { email: positional[1] } : {},
      ...positional[2] !== void 0 ? { store: positional[2] } : {}
    };
  }
  return { command: "tui", ...endpoint ? { endpoint } : {} };
}
async function main() {
  const parsed = parseArgs(process.argv);
  if (parsed.command === "help") {
    process.stdout.write(HELP);
    return;
  }
  if (parsed.command === "version") {
    process.stdout.write(`${VERSION2}
`);
    return;
  }
  if (parsed.command === "blitz") {
    if (!parsed.email || !parsed.store) {
      process.stderr.write("argus blitz: usage: argus blitz <email> <store-code>\n");
      process.exit(1);
    }
    const resolved2 = resolveEndpoint(parsed.endpoint ? { flag: parsed.endpoint } : {});
    if (!resolved2.url) {
      process.stderr.write("argus blitz: endpoint not configured (use --endpoint, ARGUS_ENDPOINT, or ~/.argusrc.json)\n");
      process.exit(1);
    }
    const exitCode = await runBlitzNonInteractive({
      email: parsed.email,
      store: parsed.store,
      endpoint: resolved2.url
    });
    process.exit(exitCode);
  }
  const resolved = resolveEndpoint(parsed.endpoint ? { flag: parsed.endpoint } : {});
  const defaultStoreCode = resolved.config.defaultStoreCode ?? "default";
  enterAltScreen();
  const ink = render(
    /* @__PURE__ */ jsx16(App, { initialEndpoint: resolved.url, defaultStoreCode }),
    { exitOnCtrlC: true }
  );
  await ink.waitUntilExit();
  leaveAltScreen();
}
var cleanup = () => {
  leaveAltScreen();
  shutdown();
};
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});
main().catch((err) => {
  process.stderr.write(`argus: ${err instanceof Error ? err.message : String(err)}
`);
  cleanup();
  process.exit(1);
});
