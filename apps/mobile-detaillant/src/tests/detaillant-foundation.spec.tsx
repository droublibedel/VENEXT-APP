import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DetaillantAppShell } from "../app-shell/DetaillantAppShell";
import {
  buildDemandHints,
  buildSalesSignals,
  sanitizeDetaillantText,
} from "../detaillant-intelligence";
import { clearDetaillantDataCache } from "../hooks/useDetaillantLiveData";
import { mockDetaillantHome, mockDetaillantProducts } from "../mocks/detaillant-mock-data";
import { DETAILLANT_TABS } from "../navigation/detaillant-navigation.config";

vi.mock("../hooks/useDetaillantFeatureFlags", () => ({
  useDetaillantFeatureFlags: () => ({
    flags: {
      detaillant_mobile_enabled: true,
      detaillant_live_data_enabled: false,
      detaillant_commerce_messaging_enabled: true,
      commercial_network_discovery_enabled: false,
      relational_catalog_enabled: false,
      terrain_quick_onboarding_enabled: false,
    },
    hydrated: true,
  }),
}));

describe("detaillant mobile foundation", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    clearDetaillantDataCache();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
  });

  it("renders six navigation tabs", () => {
    render(<DetaillantAppShell />);
    expect(screen.getByTestId("detaillant-bottom-tabs")).toBeTruthy();
    expect(DETAILLANT_TABS).toHaveLength(6);
    for (const tab of DETAILLANT_TABS) {
      expect(screen.getByTestId(tab.testId)).toBeTruthy();
    }
  });

  it("mounts only one screen at a time", async () => {
    render(<DetaillantAppShell />);
    await waitFor(() => expect(screen.getByTestId("detaillant-screen-home")).toBeTruthy());
    expect(screen.queryByTestId("detaillant-screen-products")).toBeNull();

    fireEvent.click(screen.getByTestId("detaillant-tab-products"));
    await waitFor(() => expect(screen.getByTestId("detaillant-screen-products")).toBeTruthy());
    expect(screen.queryByTestId("detaillant-screen-home")).toBeNull();
  });

  it("renders home screen", async () => {
    render(<DetaillantAppShell />);
    await waitFor(() => expect(screen.getByTestId("detaillant-metric-activity")).toBeTruthy());
    expect(screen.getByTestId("detaillant-home-hints")).toBeTruthy();
  });

  it("renders products screen", async () => {
    render(<DetaillantAppShell />);
    fireEvent.click(screen.getByTestId("detaillant-tab-products"));
    await waitFor(() => expect(screen.getByTestId("detaillant-products-search")).toBeTruthy());
    expect(screen.getByTestId("detaillant-products-list")).toBeTruthy();
  });

  it("renders orders screen", async () => {
    render(<DetaillantAppShell />);
    fireEvent.click(screen.getByTestId("detaillant-tab-orders"));
    await waitFor(() => expect(screen.getByTestId("detaillant-screen-orders")).toBeTruthy());
    expect(screen.getByTestId("detaillant-orders-list")).toBeTruthy();
  });

  it("renders network screen", async () => {
    render(<DetaillantAppShell />);
    fireEvent.click(screen.getByTestId("detaillant-tab-network"));
    await waitFor(() => expect(screen.getByTestId("detaillant-screen-network")).toBeTruthy());
    expect(screen.getByTestId("detaillant-city-activity")).toBeTruthy();
  });

  it("renders account screen", async () => {
    render(<DetaillantAppShell />);
    fireEvent.click(screen.getByTestId("detaillant-tab-account"));
    await waitFor(() => expect(screen.getByTestId("detaillant-screen-account")).toBeTruthy());
    expect(screen.getByTestId("detaillant-account-identity")).toBeTruthy();
  });

  it("shows fallback demo data badge", async () => {
    render(<DetaillantAppShell />);
    await waitFor(() => {
      const badges = screen.getAllByTestId("detaillant-data-source");
      expect(badges[0]?.getAttribute("data-fallback")).toBe("true");
      expect(badges[0]?.textContent).toContain("démonstration");
    });
  });

  it("builds subtle sales intelligence", () => {
    const signals = buildSalesSignals(mockDetaillantHome());
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]?.text).toMatch(/dynamique|Ventes/i);
  });

  it("sanitizes forbidden jargon", () => {
    expect(sanitizeDetaillantText("governance observatory systemic pressure")).not.toMatch(
      /governance|observatory|systemic/i,
    );
    const hints = buildDemandHints(mockDetaillantProducts());
    for (const h of hints) {
      expect(h.text).not.toMatch(/orchestration|observatory/i);
    }
  });
});
