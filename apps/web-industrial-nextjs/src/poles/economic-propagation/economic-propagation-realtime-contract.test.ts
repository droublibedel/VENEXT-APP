import { describe, expect, it } from "vitest";

import { ECONOMIC_PROPAGATION_REALTIME_EVENT_TYPES } from "./economic-propagation-realtime-contract";

describe("economic-propagation realtime contract", () => {
  it("includes demo and live families", () => {
    const demos = ECONOMIC_PROPAGATION_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("demo."));
    const lives = ECONOMIC_PROPAGATION_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("live."));
    expect(demos.length).toBeGreaterThan(0);
    expect(lives.length).toBeGreaterThan(0);
  });
});
