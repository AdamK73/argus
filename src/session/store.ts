import type { Session } from "./types.js";

const session: Session = {
  adminKey: null,
  endpoint: "",
  endpointHost: "",
  customerToken: null,
  storeCode: null,
  customerEmail: null,
  startedAt: Date.now(),
};

export function getSession(): Session {
  return session;
}

export function setEndpoint(url: string): void {
  session.endpoint = url;
  try {
    session.endpointHost = new URL(url).host;
  } catch {
    session.endpointHost = url;
  }
}

export function setAdminKey(key: string): void {
  session.adminKey = key;
}

export function setCustomerToken(token: string | null): void {
  session.customerToken = token;
}

export function setStoreCode(code: string | null): void {
  session.storeCode = code;
}

export function setCustomerEmail(email: string | null): void {
  session.customerEmail = email;
}

export function clearModeState(): void {
  zeroize(session.customerToken);
  session.customerToken = null;
  session.customerEmail = null;
  session.storeCode = null;
}

export function shutdown(): void {
  zeroize(session.adminKey);
  zeroize(session.customerToken);
  session.adminKey = null;
  session.customerToken = null;
  session.customerEmail = null;
  session.storeCode = null;
}

function zeroize(value: string | null): void {
  if (!value) return;
  const buf = Buffer.from(value, "utf8");
  buf.fill(0);
}

export function sessionElapsedSeconds(): number {
  return Math.floor((Date.now() - session.startedAt) / 1000);
}
