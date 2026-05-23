/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GrossisteAOrdersWorkspace } from "../workspaces/GrossisteAOrdersWorkspace";

vi.mock("../hooks/useGrossisteAFeatureFlags", () => ({
  useGrossisteAFeatureFlags: () => ({
    hydrated: true,
    flags: {
      relational_order_orchestration_enabled: true,
      commercial_delivery_flow_enabled: true,
      commercial_settlement_flow_enabled: true,
      commerce_linked_context_enabled: true,
    },
  }),
}));

vi.mock("../hooks/useGrossisteAOrdersData", () => ({
  useGrossisteAOrdersData: () => ({
    data: { enCours: [], recent: [] },
    loading: false,
    dataSource: "fallback",
    fallbackUsed: true,
    refresh: vi.fn(),
  }),
}));

afterEach(() => cleanup());

describe("grossiste A order flow (20.73)", () => {
  it("renders relational orchestration in orders workspace", async () => {
    render(<GrossisteAOrdersWorkspace enabled />);
    await waitFor(() =>
      expect(screen.getByTestId("relational-order-orchestration-shell")).toBeTruthy(),
    );
  });

  it("shows formal actor without mobile summary", async () => {
    render(<GrossisteAOrdersWorkspace enabled />);
    await waitFor(() =>
      expect(screen.getByTestId("relational-order-orchestration-shell")).toBeTruthy(),
    );
    expect(screen.queryByTestId("roo-mobile-summary")).toBeNull();
  });
});
