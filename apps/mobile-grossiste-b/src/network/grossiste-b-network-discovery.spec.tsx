/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GrossisteNetworkScreen } from "../screens/GrossisteNetworkScreen";

vi.mock("../hooks/useGrossisteFeatureFlags", () => ({
  useGrossisteFeatureFlags: () => ({
    flags: {
      grossiste_b_mobile_enabled: true,
      commercial_network_discovery_enabled: true,
      commercial_auto_accept_enabled: true,
      terrain_quick_onboarding_enabled: false,
    },
    hydrated: true,
  }),
}));

vi.mock("../hooks/useGrossisteNetworkData", () => ({
  useGrossisteNetworkData: () => ({
    data: null,
    loading: false,
    dataSource: "fallback" as const,
    fallbackUsed: true,
    refresh: vi.fn(),
    error: null,
  }),
}));

vi.mock("../hooks/useGrossisteCatalogData", () => ({
  useGrossisteCatalogData: () => ({
    data: null,
    loading: false,
    dataSource: "fallback" as const,
    fallbackUsed: true,
    refresh: vi.fn(),
    error: null,
  }),
}));

vi.mock("../hooks/useGrossisteOrdersData", () => ({
  useGrossisteOrdersData: () => ({
    data: null,
    loading: false,
    dataSource: "fallback" as const,
    fallbackUsed: true,
    refresh: vi.fn(),
    error: null,
  }),
}));

afterEach(() => cleanup());

describe("grossiste B network discovery integration", () => {
  it("renders discovery shell on network tab", async () => {
    render(<GrossisteNetworkScreen enabled />);
    expect(screen.getByTestId("grossiste-screen-network")).toBeTruthy();
    expect(await screen.findByTestId("commercial-network-discovery-shell", {}, { timeout: 5000 })).toBeTruthy();
  });
});
