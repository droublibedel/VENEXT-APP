import { describe, expect, it } from "vitest";
import { DATA_INTELLIGENCE_REALTIME_EVENT_TYPES } from "./realtime-contract";

describe("data intelligence realtime contract", () => {
  it("pairs demo and live prefixes", () => {
    const demos = DATA_INTELLIGENCE_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("demo."));
    const lives = DATA_INTELLIGENCE_REALTIME_EVENT_TYPES.filter((t) => t.startsWith("live."));
    expect(demos.length).toBe(lives.length);
    expect(demos.length).toBeGreaterThan(0);
  });
});
