/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GrossisteAProfessionalNetworkWorkspace } from "./GrossisteAProfessionalNetworkWorkspace";

vi.mock("../../hooks/useGrossisteAFeatureFlags", () => ({
  useGrossisteAFeatureFlags: () => ({
    flags: {
      grossiste_a_web_enabled: true,
      professional_commercial_network_enabled: true,
      grossiste_a_partner_network_enabled: true,
    },
    hydrated: true,
  }),
}));

vi.mock("../../hooks/useGrossisteALiveData", async () => {
  const actual = await vi.importActual<typeof import("../../hooks/useGrossisteALiveData")>(
    "../../hooks/useGrossisteALiveData",
  );
  return {
    ...actual,
    useGrossisteANetworkData: () => ({
      data: null,
      loading: false,
      dataSource: "fallback" as const,
      fallbackUsed: true,
      refresh: vi.fn(),
      error: null,
    }),
    useGrossisteAOrdersData: () => ({
      data: null,
      loading: false,
      dataSource: "fallback" as const,
      fallbackUsed: true,
      refresh: vi.fn(),
      error: null,
    }),
    useGrossisteACatalogData: () => ({
      data: null,
      loading: false,
      dataSource: "fallback" as const,
      fallbackUsed: true,
      refresh: vi.fn(),
      error: null,
    }),
    useGrossisteAFinanceData: () => ({
      data: null,
      loading: false,
      dataSource: "fallback" as const,
      fallbackUsed: true,
      refresh: vi.fn(),
      error: null,
    }),
    useGrossisteATerritoryData: () => ({
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

describe("grossiste A professional network integration", () => {
  it("renders professional network on network workspace", async () => {
    render(<GrossisteAProfessionalNetworkWorkspace enabled />);
    await waitFor(
      () => {
        expect(screen.getByTestId("professional-commercial-network-shell")).toBeTruthy();
      },
      { timeout: 8000 },
    );
  });
});
