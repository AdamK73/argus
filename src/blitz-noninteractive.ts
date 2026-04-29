import { setAdminKey, setEndpoint, shutdown } from "./session/store.js";
import { call } from "./graphql/client.js";
import { PING_QUERY, type PingResult } from "./graphql/operations/ping.js";
import { acquireCustomerToken, runSnapshot } from "./modes/blitzkrieg/runner.js";
import { redact } from "./session/redact.js";
import { isValidEmail } from "./modes/blitzkrieg/machine.js";

export interface BlitzCliInput {
  email: string;
  store: string;
  endpoint: string;
}

export type ExitCode = 0 | 1 | 2 | 3 | 4;

export async function runBlitzNonInteractive(input: BlitzCliInput): Promise<ExitCode> {
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
  const ping = await call<PingResult>({ query: PING_QUERY, authMode: "admin", storeCode: input.store });
  if (ping.status !== 200 || !ping.data?.storeConfig) {
    emit({
      ok: false,
      stage: "ping",
      status: ping.status,
      errors: ping.errors?.map((e) => e.message) ?? [],
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
    capturedAt: new Date().toISOString(),
    customer: snapshot.customer.ok ? snapshot.customer.data : { error: snapshot.customer.message },
    cartSummary: snapshot.cartSummary.ok ? snapshot.cartSummary.data : { error: snapshot.cartSummary.message },
    cartDetail: snapshot.cartDetail.ok ? snapshot.cartDetail.data : { error: snapshot.cartDetail.message },
  });
  shutdown();
  return partial ? 2 : 0;
}

function emit(payload: unknown): void {
  process.stdout.write(JSON.stringify(redact(payload)) + "\n");
}
