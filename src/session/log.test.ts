import { describe, it, expect, beforeEach } from "vitest";
import { appendLog, clearLog, getLog, subscribe } from "./log.js";

describe("session log", () => {
  beforeEach(() => clearLog());

  it("appends and returns entries in insertion order", () => {
    appendLog({ ts: 1, op: "A", authMode: "admin", status: 200, ms: 10, errorCount: 0 });
    appendLog({ ts: 2, op: "B", authMode: "customer", status: 200, ms: 20, errorCount: 0 });
    const log = getLog();
    expect(log.map((e) => e.op)).toEqual(["A", "B"]);
  });

  it("notifies subscribers on append", () => {
    let calls = 0;
    const off = subscribe(() => calls++);
    appendLog({ ts: 1, op: "A", authMode: "admin", status: 200, ms: 10, errorCount: 0 });
    appendLog({ ts: 2, op: "B", authMode: "admin", status: 200, ms: 12, errorCount: 0 });
    expect(calls).toBe(2);
    off();
    appendLog({ ts: 3, op: "C", authMode: "admin", status: 200, ms: 9, errorCount: 0 });
    expect(calls).toBe(2);
  });

  it("respects the limit argument on getLog", () => {
    for (let i = 0; i < 10; i++) {
      appendLog({ ts: i, op: `op${i}`, authMode: "admin", status: 200, ms: i, errorCount: 0 });
    }
    expect(getLog(3).map((e) => e.op)).toEqual(["op7", "op8", "op9"]);
  });
});
