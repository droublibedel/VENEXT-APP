/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DetaillantAppShell } from "../app-shell/DetaillantAppShell";
import { clearDetaillantDataCache } from "../hooks/useDetaillantLiveData";

vi.mock("../hooks/useDetaillantFeatureFlags", () => ({
  useDetaillantFeatureFlags: () => ({
    flags: {
      detaillant_mobile_enabled: true,
      detaillant_live_data_enabled: false,
      commercial_activity_feed_enabled: true,
      commercial_network_discovery_enabled: false,
      terrain_quick_onboarding_enabled: false,
      commerce_offline_foundation_enabled: true,
      commerce_offline_queue_enabled: true,
    },
    hydrated: true,
  }),
}));

describe("VENEXT-MOBILE-UX-03 detaillant", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearDetaillantDataCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("header has profile left and messaging right without duplicate title", () => {
    render(<DetaillantAppShell />);
    expect(screen.getByTestId("venext-terrain-mobile-header-profile")).toBeTruthy();
    expect(screen.getByTestId("venext-terrain-mobile-header-messaging")).toBeTruthy();
    expect(screen.queryByTestId("venext-terrain-mobile-header-title")).toBeNull();
  });

  it("home hides demo badges and refresh", async () => {
    render(<DetaillantAppShell />);
    await waitFor(() => expect(screen.getByTestId("detaillant-screen-home")).toBeTruthy());
    expect(screen.queryByTestId("detaillant-data-source")).toBeNull();
    expect(screen.queryByTestId("detaillant-refresh")).toBeNull();
    expect(screen.queryByText(/Données de démonstration/i)).toBeNull();
    expect(screen.queryByText(/Mise à jour disponible/i)).toBeNull();
    expect(screen.queryByText(/Aucune action en attente/i)).toBeNull();
  });

  it("home uses harmonized KPI grid without green hint bars", async () => {
    render(<DetaillantAppShell />);
    await waitFor(() => expect(screen.getByTestId("terrain-kpi-grid")).toBeTruthy());
    expect(screen.getByTestId("detaillant-metric-activity")).toBeTruthy();
    expect(screen.getByTestId("detaillant-metric-sales")).toBeTruthy();
    expect(screen.getByTestId("detaillant-metric-partners")).toBeTruthy();
    expect(screen.queryByTestId("detaillant-home-hints")).toBeNull();
  });
});
