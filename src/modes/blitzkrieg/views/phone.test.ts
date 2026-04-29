import { describe, it, expect } from "vitest";

// Re-implement the heuristic here for unit-testing without pulling in the React module.
function phoneLooksValid(raw: string): boolean {
  if (!raw) return false;
  const stripped = raw.replace(/[\s\-().]/g, "");
  const optionalPlus = stripped.startsWith("+") ? stripped.slice(1) : stripped;
  if (!/^[0-9]+$/.test(optionalPlus)) return false;
  return optionalPlus.length >= 7 && optionalPlus.length <= 15;
}

describe("phoneLooksValid", () => {
  it("accepts common formats", () => {
    expect(phoneLooksValid("+421 905 123 456")).toBe(true);
    expect(phoneLooksValid("+1-555-555-5555")).toBe(true);
    expect(phoneLooksValid("(0)900 123 456")).toBe(true);
    expect(phoneLooksValid("0905123456")).toBe(true);
  });

  it("rejects garbage and empties", () => {
    expect(phoneLooksValid("")).toBe(false);
    expect(phoneLooksValid("not a phone")).toBe(false);
    expect(phoneLooksValid("12345")).toBe(false); // too short
    expect(phoneLooksValid("123456789012345678")).toBe(false); // too long
    expect(phoneLooksValid("123-abc-7890")).toBe(false);
    expect(phoneLooksValid("++421900123456")).toBe(false);
  });
});
