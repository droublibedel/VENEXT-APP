/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DetaillantOrdersScreen } from "../screens/DetaillantOrdersScreen";

vi.mock("../hooks/useDetaillantFeatureFlags", () => ({
  useDetaillantFeatureFlags: () => ({
    hydrated: true,
    flags: {
      relational_order_orchestration_enabled: true,
      commercial_delivery_flow_enabled: true,
      commercial_settlement_flow_enabled: true,
    },
  }),
}));

vi.mock("../hooks/useDetaillantOrdersData", () => ({
  useDetaillantOrdersData: () => ({
    data: { enCours: [], recues: [], terminees: [] },
    loading: false,
    dataSource: "fallback",
    fallbackUsed: true,
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("detaillant order flow (20.73)", () => {
  it("shows simplified mobile summary", async () => {
    render(<DetaillantOrdersScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("roo-mobile-summary")).toBeTruthy(), {
      timeout: 8000,
    });
  });

  it("renders orchestration on orders screen", async () => {
    render(<DetaillantOrdersScreen enabled />);
    await waitFor(() =>
      expect(screen.getByTestId("relational-order-orchestration-shell")).toBeTruthy(),
    );
  });
});
