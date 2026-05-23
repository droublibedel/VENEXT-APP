import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignalStream } from "./SignalStream";
import type { OperationalSignalItem } from "../types";

describe("SignalStream industrial operational continuity (18.7A)", () => {
  it("renders SYNTHETIC_TICK label for synthetic_tick envelope rows", () => {
    const items: OperationalSignalItem[] = [
      {
        id: "ioc-1",
        pole: "INDUSTRIAL_OPERATIONAL_CONTINUITY",
        priority: "MEDIUM",
        label: "Tick",
        detail: "d",
        ts: "2026-01-01T12:00:00.000Z",
        industrialOperationalContinuityEnvelope: "demo.industrial_operational_continuity.synthetic_tick.stability",
        industrialOperationalContinuityRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    render(<SignalStream items={items} demoMode />);
    expect(screen.getByText(/SYNTHETIC_TICK/)).toBeTruthy();
    expect(screen.getByText(/Tick synthétique \(batch démo\)/)).toBeTruthy();
  });
});
