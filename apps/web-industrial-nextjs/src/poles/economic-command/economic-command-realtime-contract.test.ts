import { describe, expect, it } from "vitest";

import { ECONOMIC_COMMAND_REALTIME_EVENT_TYPES } from "./economic-command-realtime-contract";

describe("economic-command realtime contract", () => {
  it("includes live and demo pressure / arbitration / stress families", () => {
    const s = new Set(ECONOMIC_COMMAND_REALTIME_EVENT_TYPES);
    expect(s.has("live.economic_command.pressure.updated")).toBe(true);
    expect(s.has("demo.economic_command.system_stress.changed")).toBe(true);
  });
});
