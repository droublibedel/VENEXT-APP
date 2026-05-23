import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignalStream } from "./SignalStream";
import type { OperationalSignalItem } from "../types";

describe("SignalStream economic-command classification (18.5A)", () => {
  it("renders SYNTHETIC_TICK French label for classified economic-command rows", () => {
    const items: OperationalSignalItem[] = [
      {
        id: "ec-1",
        pole: "ECONOMIC_COMMAND",
        priority: "MEDIUM",
        label: "Tick",
        detail: "d",
        ts: "2026-01-01T12:00:00.000Z",
        economicCommandRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    render(<SignalStream items={items} demoMode />);
    expect(screen.getByText(/SYNTHETIC_TICK/)).toBeTruthy();
    expect(screen.getByText(/Signal synthétique de démonstration/)).toBeTruthy();
  });
});
