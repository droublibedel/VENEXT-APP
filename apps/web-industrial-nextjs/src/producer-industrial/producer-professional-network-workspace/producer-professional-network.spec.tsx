/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { ProducerProfessionalNetworkWorkspace } from "./ProducerProfessionalNetworkWorkspace";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      professional_commercial_network_enabled: true,
      producer_partner_network_enabled: true,
      producer_industrial_live_data_enabled: true,
    },
    hydrated: true,
  }),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network"))));
});

afterEach(() => {
  cleanup();
  clearProducerIndustrialDataCache();
});

describe("producer professional network workspace", () => {
  it("renders professional network shell", async () => {
    render(<ProducerProfessionalNetworkWorkspace />);
    expect(screen.getByTestId("producer-professional-network-workspace")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("professional-commercial-network-shell")).toBeTruthy();
    });
  });

  it("shows validation not auto-accept", async () => {
    render(<ProducerProfessionalNetworkWorkspace />);
    await waitFor(() => screen.getByTestId("pcn-tab-validation"));
    expect(screen.getByText(/aucune auto-connexion terrain/i)).toBeTruthy();
  });
});
