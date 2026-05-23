import { describe, expect, it } from "vitest";

import { INDUSTRIAL_OPERATIONAL_CONTINUITY_SYNTHETIC_TICK_DEMO_TYPES } from "./realtime-economic-signal.gateway";

describe("IOC synthetic tick naming (18.7A)", () => {
  it("synthetic demo event types never use live prefix", () => {
    for (const t of INDUSTRIAL_OPERATIONAL_CONTINUITY_SYNTHETIC_TICK_DEMO_TYPES) {
      expect(t.startsWith("live.")).toBe(false);
      expect(t).toContain("synthetic_tick");
    }
  });
});
