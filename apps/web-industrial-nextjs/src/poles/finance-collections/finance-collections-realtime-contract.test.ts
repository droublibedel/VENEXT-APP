import { describe, expect, it } from "vitest";
import { FINANCE_COLLECTIONS_REALTIME_EVENT_TYPES } from "./realtime-contract";

describe("finance collections realtime contract", () => {
  it("labels demo vs live pairs", () => {
    const demos = FINANCE_COLLECTIONS_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("demo."));
    const lives = FINANCE_COLLECTIONS_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("live."));
    expect(demos.length).toBe(lives.length);
    expect(demos.length).toBeGreaterThan(0);
  });
});
