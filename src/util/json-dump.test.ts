import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeSnapshot } from "./json-dump.js";
import { setAdminKey, setCustomerToken, shutdown } from "../session/store.js";

describe("json-dump", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "argus-snap-"));
    shutdown();
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes a sanitised snapshot under argus-snapshots", () => {
    setAdminKey("ADMIN-KEY-XYZ");
    setCustomerToken("CUST-TOKEN-XYZ");
    const file = writeSnapshot({
      email: "alice@example.com",
      payload: {
        adminKey: "ADMIN-KEY-XYZ",
        body: "Authorization: Bearer ADMIN-KEY-XYZ",
        token: "CUST-TOKEN-XYZ",
        customer: { email: "alice@example.com" },
      },
      cwd: dir,
    });
    const contents = readFileSync(file, "utf8");
    expect(contents).not.toContain("ADMIN-KEY-XYZ");
    expect(contents).not.toContain("CUST-TOKEN-XYZ");
    expect(contents).toContain("«redacted»");
    expect(contents).toContain("alice@example.com");
    const files = readdirSync(join(dir, "argus-snapshots"));
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/__[0-9a-f]{8}\.json$/);
  });
});
