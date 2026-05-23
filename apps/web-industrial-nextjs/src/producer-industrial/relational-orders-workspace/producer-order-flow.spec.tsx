/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProducerRelationalOrders } from "./ProducerRelationalOrders";

vi.mock("../../poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    hydrated: true,
    flags: {
      relational_order_orchestration_enabled: true,
      commercial_delivery_flow_enabled: true,
      commercial_settlement_flow_enabled: true,
      commerce_linked_context_enabled: true,
    },
  }),
}));

afterEach(() => cleanup());

describe("producer order flow (20.73)", () => {
  it("renders network orders orchestration for producteur", async () => {
    render(<ProducerRelationalOrders enabled />);
    await waitFor(() =>
      expect(screen.getByTestId("relational-order-orchestration-shell")).toBeTruthy(),
    );
    expect(screen.getByTestId("relational-order-orchestration-shell").getAttribute("data-actor")).toBe(
      "producteur",
    );
  });

  it("shows preparation panel for producteur scenario", async () => {
    render(<ProducerRelationalOrders enabled />);
    await waitFor(() => expect(screen.getByTestId("roo-preparation-panel")).toBeTruthy());
  });
});
