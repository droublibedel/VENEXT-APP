import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { PRODUCER_REGIONS } from "../mocks/industrial-mock-data";
import { ProducerPoleNav } from "../navigation/ProducerPoleNav";
import { PRODUCER_POLE_NAV } from "../navigation/producer-navigation.config";
import { ProducerSupplyLogisticsWorkspace } from "./ProducerSupplyLogisticsWorkspace";
import { buildSupplyInsights, sanitizeSupplyText } from "./producer-supply.viewmodel";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_supply_logistics_workspace_enabled: true,
      producer_industrial_live_data_enabled: true,
    },
    hydrated: true,
  }),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockRejectedValue(new Error("network"));
});

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  clearProducerIndustrialDataCache();
});

describe("producer supply logistics workspace", () => {
  it("renders workspace and navigation tabs", async () => {
    render(<ProducerSupplyLogisticsWorkspace />);
    expect(screen.getByTestId("producer-dashboard-supply-logistics-workspace")).toBeTruthy();
    expect(screen.getByTestId("supply-workspace-tabs")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("producer-supply-overview-panel")).toBeTruthy();
    });
  });

  it("mounts only one panel at a time", async () => {
    render(<ProducerSupplyLogisticsWorkspace />);
    await waitFor(() => screen.getByTestId("producer-supply-overview-panel"));
    fireEvent.click(screen.getByTestId("supply-tab-coverage"));
    await waitFor(() => {
      expect(screen.getByTestId("producer-supply-coverage-panel")).toBeTruthy();
      expect(screen.getByTestId("supply-logistics-map")).toBeTruthy();
    });
    expect(screen.queryByTestId("producer-supply-overview-panel")).toBeNull();
  });

  it("shows fallback when API fails", async () => {
    render(<ProducerSupplyLogisticsWorkspace />);
    await waitFor(() => {
      expect(screen.getAllByText(/démonstration enrichies|synchronisées/i).length).toBeGreaterThan(0);
    });
  });

  it("renders overview metrics", async () => {
    render(<ProducerSupplyLogisticsWorkspace />);
    await waitFor(() => {
      expect(screen.getByText("Flux actifs")).toBeTruthy();
      expect(screen.getByText("Stabilité supply")).toBeTruthy();
    });
  });

  it("sanitizes forbidden jargon in insights", () => {
    const text = sanitizeSupplyText("observatory governance synthesis systemic collapse");
    expect(text.toLowerCase()).not.toContain("observatory");
    expect(text.toLowerCase()).not.toContain("governance");
    expect(text.toLowerCase()).not.toContain("synthesis");
  });

  it("builds deterministic supply insights", () => {
    const insights = buildSupplyInsights([...PRODUCER_REGIONS], null, null, null);
    expect(insights.some((i) => i.line1.includes("hub logistique"))).toBe(true);
    expect(insights.some((i) => i.line1.includes("Opportunité"))).toBe(true);
  });

  it("virtualized hub table renders headers", async () => {
    render(<ProducerSupplyLogisticsWorkspace />);
    fireEvent.click(screen.getByTestId("supply-tab-hubs"));
    await waitFor(() => {
      expect(screen.getByTestId("supply-hub-virtual-list")).toBeTruthy();
      expect(screen.getByText("Hub")).toBeTruthy();
    });
  });

  it("places supply pole after marketing in navigation", () => {
    const idx = PRODUCER_POLE_NAV.findIndex((p) => p.id === "marketing-activation-workspace");
    expect(PRODUCER_POLE_NAV[idx + 1]?.id).toBe("supply-logistics-workspace");
    render(<ProducerPoleNav activePole="supply-logistics-workspace" onSelect={vi.fn()} />);
    expect(screen.getByTestId("producer-nav-supply-logistics-workspace")).toBeTruthy();
  });
});
