import { describe, it, expect } from "vitest";
import { isValidEmail, initialBlitzState } from "./machine.js";

describe("blitzkrieg machine", () => {
  it("validates email addresses", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("user.name+tag@domain.example")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a @b.co")).toBe(false);
  });

  it("starts at the email step", () => {
    const s = initialBlitzState("default");
    expect(s.step).toBe("email");
    expect(s.store).toBe("default");
    expect(s.customer.status).toBe("loading");
  });
});
