import { describe, it, expect, beforeEach } from "vitest";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readConfigFile, isValidUrl } from "./endpoint-resolver.js";

describe("endpoint-resolver", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "argus-cfg-"));
  });

  it("returns empty when file missing", () => {
    const result = readConfigFile(join(tmp, "missing.json"));
    expect(result).toEqual({});
    rmSync(tmp, { recursive: true, force: true });
  });

  it("rejects unknown keys via zod strict", () => {
    const path = join(tmp, ".argusrc.json");
    writeFileSync(path, JSON.stringify({ endpoint: "https://x/graphql", admin_key: "no" }));
    expect(() => readConfigFile(path)).toThrow();
    rmSync(tmp, { recursive: true, force: true });
  });

  it("accepts whitelisted keys", () => {
    const path = join(tmp, ".argusrc.json");
    writeFileSync(
      path,
      JSON.stringify({ endpoint: "https://x/graphql", defaultStoreCode: "uk", timeoutMs: 5000 })
    );
    const cfg = readConfigFile(path);
    expect(cfg).toEqual({
      endpoint: "https://x/graphql",
      defaultStoreCode: "uk",
      timeoutMs: 5000,
    });
    rmSync(tmp, { recursive: true, force: true });
  });

  it("validates url shape", () => {
    expect(isValidUrl("https://x/graphql")).toBe(true);
    expect(isValidUrl("http://localhost:8080/graphql")).toBe(true);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("ftp://x/")).toBe(false);
  });
});
