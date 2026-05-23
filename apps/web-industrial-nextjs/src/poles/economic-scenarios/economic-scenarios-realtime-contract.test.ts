import { describe, expect, it } from "vitest";

import { ECONOMIC_SCENARIOS_REALTIME_EVENT_TYPES } from "./economic-scenarios-realtime-contract";

describe("economic-scenarios realtime contract", () => {
  it("includes demo and live economic_scenarios families", () => {
    expect(ECONOMIC_SCENARIOS_REALTIME_EVENT_TYPES.some((t) => t.startsWith("demo.economic_scenarios."))).toBe(true);
    expect(ECONOMIC_SCENARIOS_REALTIME_EVENT_TYPES.some((t) => t.startsWith("live.economic_scenarios."))).toBe(true);
  });
});
