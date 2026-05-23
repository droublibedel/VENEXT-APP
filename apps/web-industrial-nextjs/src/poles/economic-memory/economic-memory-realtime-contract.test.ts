import { describe, expect, it } from "vitest";

import { ECONOMIC_MEMORY_REALTIME_EVENT_TYPES } from "./economic-memory-realtime-contract";

describe("economic-memory realtime contract", () => {
  it("includes demo and live economic_memory families", () => {
    expect(ECONOMIC_MEMORY_REALTIME_EVENT_TYPES.some((t) => t.startsWith("demo.economic_memory."))).toBe(true);
    expect(ECONOMIC_MEMORY_REALTIME_EVENT_TYPES.some((t) => t.startsWith("live.economic_memory."))).toBe(true);
  });
});
