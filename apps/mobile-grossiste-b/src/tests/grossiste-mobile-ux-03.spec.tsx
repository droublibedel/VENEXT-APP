/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrossisteBAppShell } from "../app-shell/GrossisteBAppShell";
import { clearGrossisteDataCache } from "../hooks/useGrossisteLiveData";

vi.mock("../hooks/useGrossisteFeatureFlags", () => ({
  useGrossisteFeatureFlags: () => ({
    flags: {
      grossiste_b_mobile_enabled: true,
      grossiste_b_live_data_enabled: false,
      grossiste_b_commerce_messaging_enabled: true,
      commercial_activity_feed_enabled: true,
      commercial_network_discovery_enabled: false,
      terrain_quick_onboarding_enabled: false,
      commerce_offline_foundation_enabled: true,
      commerce_offline_queue_enabled: true,
    },
    hydrated: true,
  }),
}));

describe("VENEXT-MOBILE-UX-03 grossiste-b", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearGrossisteDataCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("header has profile left and messaging right without duplicate title", () => {
    render(<GrossisteBAppShell />);
    expect(screen.getByTestId("venext-terrain-mobile-header-profile")).toBeTruthy();
    expect(screen.getByTestId("venext-terrain-mobile-header-messaging")).toBeTruthy();
    expect(screen.queryByTestId("venext-terrain-mobile-header-title")).toBeNull();
  });

  it("activity home hides demo badges, refresh, and offline idle copy", async () => {
    render(<GrossisteBAppShell />);
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-activity")).toBeTruthy());
    expect(screen.queryByTestId("grossiste-data-source")).toBeNull();
    expect(screen.queryByTestId("grossiste-refresh")).toBeNull();
    expect(screen.queryByText(/Données de démonstration/i)).toBeNull();
    expect(screen.queryByText(/Mise à jour disponible/i)).toBeNull();
    expect(screen.queryByText(/Aucune action en attente/i)).toBeNull();
  });

  it("activity uses harmonized KPI grid without green hint strip", async () => {
    render(<GrossisteBAppShell />);
    await waitFor(() => expect(screen.getByTestId("terrain-kpi-grid")).toBeTruthy());
    expect(screen.getByTestId("grossiste-metric-network")).toBeTruthy();
    expect(screen.getByTestId("grossiste-metric-orders")).toBeTruthy();
    expect(screen.getByTestId("grossiste-metric-partners")).toBeTruthy();
    expect(screen.queryByTestId("grossiste-activity-hints")).toBeNull();
  });
});
