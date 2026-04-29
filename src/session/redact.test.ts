import { describe, it, expect, beforeEach } from "vitest";
import { redact, REDACTED_SENTINEL } from "./redact.js";
import { setAdminKey, setCustomerToken, shutdown } from "./store.js";

describe("redact", () => {
  beforeEach(() => {
    shutdown();
  });

  it("redacts sensitive keys regardless of value", () => {
    const out = redact({
      authorization: "Bearer abc123",
      token: "xyz",
      password: "p",
      api_key: "k",
      nested: { adminKey: "secret" },
      normal: "ok",
    });
    expect(out).toEqual({
      authorization: REDACTED_SENTINEL,
      token: REDACTED_SENTINEL,
      password: REDACTED_SENTINEL,
      api_key: REDACTED_SENTINEL,
      nested: { adminKey: REDACTED_SENTINEL },
      normal: "ok",
    });
  });

  it("redacts admin key from string values", () => {
    setAdminKey("super-secret-admin-key");
    const out = redact({ note: "the key is super-secret-admin-key embedded" });
    expect(out).toEqual({ note: `the key is ${REDACTED_SENTINEL} embedded` });
  });

  it("redacts customer token from string values", () => {
    setCustomerToken("ct-abcdefg");
    const out = redact("customer token = ct-abcdefg here");
    expect(out).toBe(`customer token = ${REDACTED_SENTINEL} here`);
  });

  it("redacts arbitrary Bearer tokens in strings", () => {
    const out = redact("header Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.foo");
    expect(out).toBe(`header Authorization: Bearer ${REDACTED_SENTINEL}`);
  });

  it("walks arrays", () => {
    setAdminKey("k");
    const out = redact(["a", "k", { token: "x" }]);
    expect(out).toEqual(["a", REDACTED_SENTINEL, { token: REDACTED_SENTINEL }]);
  });
});
