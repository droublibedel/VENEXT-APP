import { describe, expect, it } from "vitest";

import {
  classifyEconomicCommandStreamItem,
  ECONOMIC_COMMAND_REALTIME_CLASS_LABELS,
} from "./economic-command-realtime-classification";
import type { OperationalSignalItem } from "../types";

describe("economic-command realtime classification (18.5A)", () => {
  it("labels synthetic tick when classification is set", () => {
    const itm: OperationalSignalItem = {
      id: "1",
      pole: "ECONOMIC_COMMAND",
      priority: "MEDIUM",
      label: "x",
      detail: "y",
      ts: "",
      economicCommandRealtimeClass: "SYNTHETIC_TICK",
    };
    expect(classifyEconomicCommandStreamItem(itm)).toBe("SYNTHETIC_TICK");
    expect(ECONOMIC_COMMAND_REALTIME_CLASS_LABELS.SYNTHETIC_TICK).toContain("synthétique");
  });

  it("classifies demo mirror from envelope when class unset", () => {
    const itm: OperationalSignalItem = {
      id: "1",
      pole: "ECONOMIC_COMMAND",
      priority: "MEDIUM",
      label: "x",
      detail: "y",
      ts: "",
      economicCommandEnvelope: "demo.economic_command.pulse",
    };
    expect(classifyEconomicCommandStreamItem(itm)).toBe("DEMO_MIRROR");
    expect(ECONOMIC_COMMAND_REALTIME_CLASS_LABELS.DEMO_MIRROR).toContain("démonstration");
  });

  it("classifies live domain from envelope when class unset", () => {
    const itm: OperationalSignalItem = {
      id: "1",
      pole: "ECONOMIC_COMMAND",
      priority: "MEDIUM",
      label: "x",
      detail: "y",
      ts: "",
      economicCommandEnvelope: "live.economic_command.pulse",
    };
    expect(classifyEconomicCommandStreamItem(itm)).toBe("DOMAIN_LIVE");
    expect(ECONOMIC_COMMAND_REALTIME_CLASS_LABELS.DOMAIN_LIVE).toContain("réel");
  });
});
