/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

vi.mock("../hooks/useGrossisteLiveData", async () => {
  const actual = await vi.importActual<typeof import("../hooks/useGrossisteLiveData")>(
    "../hooks/useGrossisteLiveData",
  );
  return {
    ...actual,
    useGrossisteNetworkData: () => ({
      data: null,
      loading: false,
      dataSource: "fallback" as const,
      fallbackUsed: true,
      refresh: vi.fn(),
      error: null,
    }),
    useGrossisteCatalogData: () => ({
      data: null,
      loading: false,
      dataSource: "fallback" as const,
      fallbackUsed: true,
      refresh: vi.fn(),
      error: null,
    }),
    useGrossisteOrdersData: () => ({
      data: null,
      loading: false,
      dataSource: "fallback" as const,
      fallbackUsed: true,
      refresh: vi.fn(),
      error: null,
    }),
  };
});

afterEach(() => cleanup());

describe("grossiste B network discovery integration", () => {
  it("renders discovery shell on network tab", async () => {
    render(<GrossisteNetworkScreen enabled />);
    expect(screen.getByTestId("grossiste-screen-network")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("commercial-network-discovery-shell")).toBeTruthy();
    });
  });
});
