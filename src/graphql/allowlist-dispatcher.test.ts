import { describe, it, expect } from "vitest";
import { request } from "undici";
import { createAllowListDispatcher, EgressDeniedError } from "./allowlist-dispatcher.js";

describe("allowlist dispatcher", () => {
  it("rejects requests to non-allowed hosts", async () => {
    const dispatcher = createAllowListDispatcher({
      allowedHost: "allowed.example.com",
      timeoutMs: 1000,
    });
    let err: unknown;
    try {
      await request("https://blocked.example.com/", { dispatcher });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toMatch(/egress denied/);
    expect(err).toBeInstanceOf(EgressDeniedError);
  });

  it("allows requests to the configured host (via dns failure not denial)", async () => {
    const dispatcher = createAllowListDispatcher({
      allowedHost: "allowed.invalid",
      timeoutMs: 500,
    });
    let err: unknown;
    try {
      await request("https://allowed.invalid/", { dispatcher });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).not.toMatch(/egress denied/);
  });
});
