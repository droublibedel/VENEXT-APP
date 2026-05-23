import { describe, expect, it } from "vitest";

import { ECONOMIC_COORDINATION_REALTIME_EVENT_TYPES } from "./economic-coordination-realtime-contract";

describe("economic-coordination realtime contract", () => {
  it("includes live and demo economic_coordination labels", () => {
    const s = new Set(ECONOMIC_COORDINATION_REALTIME_EVENT_TYPES);
    expect(s.has("live.economic_coordination.bundle.refreshed")).toBe(true);
    expect(s.has("demo.economic_coordination.bundle.refreshed")).toBe(true);
  });
});
