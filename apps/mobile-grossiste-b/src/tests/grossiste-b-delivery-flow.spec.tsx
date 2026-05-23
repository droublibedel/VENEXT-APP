/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GrossisteActivityScreen } from "../screens/GrossisteActivityScreen";

vi.mock("../hooks/useGrossisteFeatureFlags", () => ({
  useGrossisteFeatureFlags: () => ({
    hydrated: true,
    flags: {
      commercial_delivery_flow_enabled: true,
      commercial_reception_confirmation_enabled: true,
      commercial_delivery_activity_enabled: true,
    },
  }),
}));

vi.mock("../hooks/useGrossisteActivityData", () => ({
  useGrossisteActivityData: () => ({
    data: {
      organizationId: "org-b",
      networkActivityToday: 10,
      newOrdersCount: 3,
      activePartners: 5,
      movingProducts: [],
      simpleAlerts: [],
      activeCities: ["Abidjan"],
      discreetTrends: [],
    },
    loading: false,
    dataSource: "fallback",
    fallbackUsed: true,
    refresh: vi.fn(),
  }),
}));

afterEach(() => cleanup());

describe("grossiste B delivery flow (20.74)", () => {
  it("shows mobile delivery card on activity screen", async () => {
    render(<GrossisteActivityScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cdf-mobile-card")).toBeTruthy());
  });
});
