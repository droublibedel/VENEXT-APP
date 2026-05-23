/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DetaillantNetworkScreen } from "../screens/DetaillantNetworkScreen";

vi.mock("../hooks/useDetaillantFeatureFlags", () => ({
  useDetaillantFeatureFlags: () => ({
    flags: {
      detaillant_mobile_enabled: true,
      commercial_network_discovery_enabled: true,
      commercial_auto_accept_enabled: true,
      terrain_quick_onboarding_enabled: false,
    },
    hydrated: true,
  }),
}));

vi.mock("../hooks/useDetaillantLiveData", async () => {
  const actual = await vi.importActual<typeof import("../hooks/useDetaillantLiveData")>(
    "../hooks/useDetaillantLiveData",
  );
  return {
    ...actual,
    useDetaillantNetworkData: () => ({
      data: null,
      loading: false,
      dataSource: "fallback" as const,
      fallbackUsed: true,
      refresh: vi.fn(),
      error: null,
    }),
    useDetaillantProductsData: () => ({
      data: null,
      loading: false,
      dataSource: "fallback" as const,
      fallbackUsed: true,
      refresh: vi.fn(),
      error: null,
    }),
    useDetaillantOrdersData: () => ({
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

describe("detaillant network discovery integration", () => {
  it("renders discovery shell on network tab", async () => {
    render(<DetaillantNetworkScreen enabled />);
    expect(screen.getByTestId("detaillant-screen-network")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("commercial-network-discovery-shell")).toBeTruthy();
    });
  });
});
