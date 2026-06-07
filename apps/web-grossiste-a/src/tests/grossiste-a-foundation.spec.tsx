import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrossisteAAppShell } from "../app-shell/GrossisteAAppShell";
import { sanitizeGrossisteAText } from "../grossiste-a-intelligence";
import { clearGrossisteADataCache } from "../hooks/useGrossisteALiveData";
import { GROSSISTE_A_NAV } from "../navigation/grossiste-a-navigation.config";

vi.mock("../hooks/useGrossisteAFeatureFlags", () => ({
  useGrossisteAFeatureFlags: () => ({
    flags: {
      grossiste_a_web_enabled: true,
      grossiste_a_live_data_enabled: false,
      grossiste_a_commerce_messaging_enabled: true,
      commerce_conversation_governance_enabled: true,
      professional_commercial_network_enabled: false,
      relational_catalog_enabled: false,
    },
    hydrated: true,
  }),
}));

describe("grossiste A web foundation", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearGrossisteADataCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("renders sidebar navigation", () => {
    render(<GrossisteAAppShell />);
    expect(screen.getByTestId("grossiste-a-sidebar")).toBeTruthy();
    expect(GROSSISTE_A_NAV).toHaveLength(10);
    for (const item of GROSSISTE_A_NAV) {
      expect(screen.getByTestId(item.testId)).toBeTruthy();
    }
  });

  it("mounts only one workspace at a time", async () => {
    render(<GrossisteAAppShell />);
    await waitFor(() => expect(screen.getByTestId("ga-workspace-overview")).toBeTruthy());
    expect(screen.queryByTestId("ga-workspace-network-legacy")).toBeNull();
    fireEvent.click(screen.getByTestId("ga-nav-network"));
    await waitFor(() => expect(screen.getByTestId("ga-workspace-network-legacy")).toBeTruthy());
    expect(screen.queryByTestId("ga-workspace-overview")).toBeNull();
  });

  it("renders overview workspace", async () => {
    render(<GrossisteAAppShell />);
    await waitFor(() => expect(screen.getByTestId("ga-metric-activity")).toBeTruthy());
  });

  it("renders network workspace", async () => {
    render(<GrossisteAAppShell />);
    fireEvent.click(screen.getByTestId("ga-nav-network"));
    await waitFor(() => expect(screen.getByTestId("ga-workspace-network-legacy")).toBeTruthy());
  });

  it("renders messaging workspace", async () => {
    render(<GrossisteAAppShell />);
    fireEvent.click(screen.getByTestId("ga-nav-commerce-messaging"));
    await waitFor(() => expect(screen.getByTestId("ga-workspace-messaging")).toBeTruthy(), {
      timeout: 8000,
    });
    await waitFor(() => expect(screen.getByTestId("grossiste-a-commerce-messaging")).toBeTruthy(), {
      timeout: 8000,
    });
  });

  it("renders orders workspace", async () => {
    render(<GrossisteAAppShell />);
    fireEvent.click(screen.getByTestId("ga-nav-orders"));
    await waitFor(() => expect(screen.getByTestId("ga-orders-list")).toBeTruthy());
  });

  it("renders distribution workspace with map", async () => {
    render(<GrossisteAAppShell />);
    fireEvent.click(screen.getByTestId("ga-nav-distribution"));
    await waitFor(
      () => expect(screen.getByTestId("ga-workspace-distribution")).toBeTruthy(),
      { timeout: 5000 },
    );
    await waitFor(() => expect(screen.getByTestId("ga-distribution-map")).toBeTruthy(), {
      timeout: 5000,
    });
  });

  it("renders catalog workspace", async () => {
    render(<GrossisteAAppShell />);
    fireEvent.click(screen.getByTestId("ga-nav-catalog"));
    await waitFor(() => expect(screen.getByTestId("ga-catalog-search")).toBeTruthy());
  });

  it("renders territory workspace", async () => {
    render(<GrossisteAAppShell />);
    fireEvent.click(screen.getByTestId("ga-nav-territory"));
    await waitFor(() => expect(screen.getByTestId("ga-workspace-territory")).toBeTruthy());
  });

  it("renders finance workspace", async () => {
    render(<GrossisteAAppShell />);
    fireEvent.click(screen.getByTestId("ga-nav-finance"));
    await waitFor(() => expect(screen.getByTestId("ga-finance-stability")).toBeTruthy());
  });

  it("renders intelligence workspace", async () => {
    render(<GrossisteAAppShell />);
    fireEvent.click(screen.getByTestId("ga-nav-intelligence"));
    await waitFor(() => expect(screen.getByTestId("ga-intelligence-hints")).toBeTruthy());
  });

  it("marks fallback data source without visible demo copy", async () => {
    render(<GrossisteAAppShell />);
    await waitFor(() => {
      const badges = screen.getAllByTestId("grossiste-a-data-source");
      expect(badges[0]?.getAttribute("data-fallback")).toBe("true");
      expect(badges[0]?.textContent?.trim()).toBe("");
    });
  });

  it("sanitizes forbidden jargon", () => {
    expect(sanitizeGrossisteAText("governance observatory systemic")).not.toMatch(
      /governance|observatory|systemic/i,
    );
  });
});
