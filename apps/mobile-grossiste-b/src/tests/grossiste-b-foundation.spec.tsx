import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrossisteBAppShell } from "../app-shell/GrossisteBAppShell";
import { clearGrossisteDataCache } from "../hooks/useGrossisteLiveData";
import {
  buildActivityHints,
  buildDemandSignals,
  sanitizeGrossisteText,
} from "../mocks/grossiste-b-intelligence";
import { mockGrossisteActivity, mockGrossisteCatalog } from "../mocks/grossiste-b-mock-data";
import { GROSSISTE_B_BOTTOM_TABS } from "../navigation/grossiste-b-navigation.config";

vi.mock("../hooks/useGrossisteFeatureFlags", () => ({
  useGrossisteFeatureFlags: () => ({
    flags: {
      grossiste_b_mobile_enabled: true,
      grossiste_b_live_data_enabled: false,
      grossiste_b_commerce_messaging_enabled: true,
      commercial_network_discovery_enabled: false,
      relational_catalog_enabled: false,
      terrain_quick_onboarding_enabled: false,
    },
    hydrated: true,
  }),
}));

describe("grossiste B mobile foundation", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    clearGrossisteDataCache();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
  });

  it("renders four bottom navigation tabs and terrain header", () => {
    render(<GrossisteBAppShell />);
    expect(screen.getByTestId("grossiste-bottom-tabs")).toBeTruthy();
    expect(GROSSISTE_B_BOTTOM_TABS).toHaveLength(4);
    for (const tab of GROSSISTE_B_BOTTOM_TABS) {
      expect(screen.getByTestId(tab.testId)).toBeTruthy();
    }
    expect(screen.getByTestId("venext-terrain-mobile-header")).toBeTruthy();
    expect(screen.queryByTestId("grossiste-tab-messaging")).toBeNull();
    expect(screen.queryByTestId("grossiste-tab-profile")).toBeNull();
  });

  it("mounts only one screen at a time", async () => {
    render(<GrossisteBAppShell />);
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-activity")).toBeTruthy());
    expect(screen.queryByTestId("grossiste-screen-catalog")).toBeNull();

    fireEvent.click(screen.getByTestId("grossiste-tab-catalog"));
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-catalog")).toBeTruthy());
    expect(screen.queryByTestId("grossiste-screen-activity")).toBeNull();
  });

  it("renders activity screen with harmonized KPI metrics", async () => {
    render(<GrossisteBAppShell />);
    await waitFor(() => expect(screen.getByTestId("terrain-kpi-grid")).toBeTruthy());
    expect(screen.getByTestId("grossiste-metric-network")).toBeTruthy();
    expect(screen.queryByTestId("grossiste-activity-hints")).toBeNull();
  });

  it("renders catalog screen with search", async () => {
    render(<GrossisteBAppShell />);
    fireEvent.click(screen.getByTestId("grossiste-tab-catalog"));
    await waitFor(() => expect(screen.getByTestId("grossiste-catalog-search")).toBeTruthy());
    expect(screen.getByTestId("grossiste-catalog-list")).toBeTruthy();
  });

  it("renders orders screen", async () => {
    render(<GrossisteBAppShell />);
    fireEvent.click(screen.getByTestId("grossiste-tab-orders"));
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-orders")).toBeTruthy());
    expect(screen.getByTestId("grossiste-orders-list")).toBeTruthy();
  });

  it("renders network screen", async () => {
    render(<GrossisteBAppShell />);
    fireEvent.click(screen.getByTestId("grossiste-tab-network"));
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-network")).toBeTruthy());
    expect(screen.getByTestId("grossiste-active-cities")).toBeTruthy();
  });

  it("renders profile screen from header", async () => {
    render(<GrossisteBAppShell />);
    fireEvent.click(screen.getByTestId("venext-terrain-mobile-header-profile"));
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-profile")).toBeTruthy());
    expect(screen.getByTestId("grossiste-profile-identity")).toBeTruthy();
  });

  it("does not show demo data badge on activity home", async () => {
    render(<GrossisteBAppShell />);
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-activity")).toBeTruthy());
    expect(screen.queryByTestId("grossiste-data-source")).toBeNull();
  });

  it("sanitizes forbidden jargon in intelligence", () => {
    expect(sanitizeGrossisteText("systemic pressure on governance corridor")).not.toMatch(
      /governance|systemic/i,
    );
    const hints = buildActivityHints(mockGrossisteActivity());
    expect(hints.length).toBeGreaterThan(0);
    for (const h of hints) {
      expect(h.text).not.toMatch(/governance|observatory|orchestration/i);
    }
  });

  it("builds deterministic demand signals", () => {
    const signals = buildDemandSignals(mockGrossisteCatalog());
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]?.text).toMatch(/demandé|populaire/i);
  });
});
