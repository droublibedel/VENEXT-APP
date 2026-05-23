/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GrossisteOrdersScreen } from "../screens/GrossisteOrdersScreen";

vi.mock("../hooks/useGrossisteFeatureFlags", () => ({
  useGrossisteFeatureFlags: () => ({
    hydrated: true,
    flags: {
      relational_order_orchestration_enabled: true,
      commercial_delivery_flow_enabled: true,
      commercial_settlement_flow_enabled: true,
    },
  }),
}));

vi.mock("../hooks/useGrossisteOrdersData", () => ({
  useGrossisteOrdersData: () => ({
    data: { received: [], sent: [] },
    loading: false,
    dataSource: "fallback",
    fallbackUsed: true,
    refresh: vi.fn(),
  }),
}));

afterEach(() => cleanup());

describe("grossiste B order flow (20.73)", () => {
  it("renders terrain mobile summary", async () => {
    render(<GrossisteOrdersScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("roo-mobile-summary")).toBeTruthy());
  });

  it("integrates orchestration shell on orders screen", async () => {
    render(<GrossisteOrdersScreen enabled />);
    await waitFor(() =>
      expect(screen.getByTestId("relational-order-orchestration-shell")).toBeTruthy(),
    );
  });
});
