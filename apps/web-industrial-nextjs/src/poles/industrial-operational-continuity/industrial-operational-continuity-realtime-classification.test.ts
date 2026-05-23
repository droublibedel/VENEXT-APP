import { describe, expect, it } from "vitest";

import { classifyIndustrialOperationalContinuityStreamItem } from "./industrial-operational-continuity-realtime-classification";
import type { OperationalSignalItem } from "../types";

describe("classifyIndustrialOperationalContinuityStreamItem (18.7A)", () => {
  it("classifies synthetic_tick envelopes as SYNTHETIC_TICK when class is absent", () => {
    const it: OperationalSignalItem = {
      id: "1",
      pole: "INDUSTRIAL_OPERATIONAL_CONTINUITY",
      priority: "MEDIUM",
      label: "x",
      detail: "d",
      ts: "2026-01-01T00:00:00.000Z",
      industrialOperationalContinuityEnvelope: "demo.industrial_operational_continuity.synthetic_tick.cadence",
    };
    expect(classifyIndustrialOperationalContinuityStreamItem(it)).toBe("SYNTHETIC_TICK");
  });

  it("classifies live envelopes as DOMAIN_LIVE when class is absent", () => {
    const it: OperationalSignalItem = {
      id: "2",
      pole: "INDUSTRIAL_OPERATIONAL_CONTINUITY",
      priority: "MEDIUM",
      label: "x",
      detail: "d",
      ts: "2026-01-01T00:00:00.000Z",
      industrialOperationalContinuityEnvelope: "live.industrial_operational_continuity.stability.updated",
    };
    expect(classifyIndustrialOperationalContinuityStreamItem(it)).toBe("DOMAIN_LIVE");
  });
});
