/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProducerCommercialDelivery } from "./ProducerCommercialDelivery";

vi.mock("../../poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    hydrated: true,
    flags: {
      commercial_delivery_flow_enabled: true,
      commercial_reception_confirmation_enabled: true,
      commercial_delivery_activity_enabled: true,
    },
  }),
}));

afterEach(() => cleanup());

describe("producer delivery flow (20.74)", () => {
  it("renders network delivery for producteur", async () => {
    render(<ProducerCommercialDelivery enabled />);
    await waitFor(() => expect(screen.getByTestId("commercial-delivery-flow-shell")).toBeTruthy());
    expect(screen.getByTestId("commercial-delivery-flow-shell").getAttribute("data-actor")).toBe("producteur");
  });

  it("shows corridor route card", async () => {
    render(<ProducerCommercialDelivery enabled />);
    await waitFor(() => expect(screen.getByTestId("cdf-route-card")).toBeTruthy());
  });
});
