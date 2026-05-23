import { describe, expect, it } from "vitest";
import { SUPPLY_LOGISTICS_REALTIME_EVENT_TYPES } from "./realtime-contract";

describe("supply logistics realtime contract", () => {
  it("labels demo vs live pairs", () => {
    const demos = SUPPLY_LOGISTICS_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("demo."));
    const lives = SUPPLY_LOGISTICS_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("live."));
    expect(demos.length).toBe(lives.length);
    expect(demos.length).toBeGreaterThan(0);
  });
});
