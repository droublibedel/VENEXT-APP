/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GrossisteADistributionWorkspace } from "../workspaces/GrossisteADistributionWorkspace";

vi.mock("../hooks/useGrossisteAFeatureFlags", () => ({
  useGrossisteAFeatureFlags: () => ({
    hydrated: true,
    flags: {
      commercial_delivery_flow_enabled: true,
      commercial_reception_confirmation_enabled: true,
      commercial_delivery_activity_enabled: true,
    },
  }),
}));

vi.mock("../hooks/useGrossisteADistributionData", () => ({
  useGrossisteADistributionData: () => ({
    data: { map: null, activeCorridors: [], distributionTensions: [] },
    loading: false,
    dataSource: "fallback",
    fallbackUsed: true,
    refresh: vi.fn(),
  }),
}));

afterEach(() => cleanup());

describe("grossiste A delivery flow (20.74)", () => {
  it("renders delivery shell in distribution workspace", async () => {
    render(<GrossisteADistributionWorkspace enabled />);
    await waitFor(() => expect(screen.getByTestId("commercial-delivery-flow-shell")).toBeTruthy());
  });
});
