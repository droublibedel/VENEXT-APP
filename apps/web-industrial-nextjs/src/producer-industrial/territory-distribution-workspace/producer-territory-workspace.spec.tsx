import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { ProducerPoleNav } from "../navigation/ProducerPoleNav";
import { ProducerTerritoryDistributionWorkspace } from "./ProducerTerritoryDistributionWorkspace";
import {
  buildOpportunities,
  sanitizeTerritoryText,
} from "./producer-territory.viewmodel";
import { PRODUCER_REGIONS } from "../mocks/industrial-mock-data";
import { PRODUCER_POLE_NAV } from "../navigation/producer-navigation.config";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_territory_distribution_workspace_enabled: true,
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

describe("producer territory distribution workspace", () => {
  it("renders workspace and navigation tabs", async () => {
    render(<ProducerTerritoryDistributionWorkspace />);
    expect(screen.getByTestId("producer-dashboard-territory-distribution")).toBeTruthy();
    expect(screen.getByTestId("territory-workspace-tabs")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("producer-territory-overview-panel")).toBeTruthy();
    });
  });

  it("mounts only one panel at a time", async () => {
    render(<ProducerTerritoryDistributionWorkspace />);
    await waitFor(() => screen.getByTestId("producer-territory-overview-panel"));
    fireEvent.click(screen.getByTestId("territory-tab-corridors"));
    await waitFor(() => {
      expect(screen.getByTestId("producer-distribution-corridor-panel")).toBeTruthy();
      expect(screen.getByTestId("territory-distribution-map")).toBeTruthy();
    });
    expect(screen.queryByTestId("producer-territory-overview-panel")).toBeNull();
  });

  it("shows fallback when API fails", async () => {
    render(<ProducerTerritoryDistributionWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-fallback")).toBe("true");
      expect(screen.queryByText(/démonstration enrichies|synchronisées/i)).toBeNull();
    });
  });

  it("renders overview metrics", async () => {
    render(<ProducerTerritoryDistributionWorkspace />);
    await waitFor(() => {
      expect(screen.getByText("Territoires actifs")).toBeTruthy();
      expect(screen.getByText("Stabilité distribution")).toBeTruthy();
    });
  });

  it("sanitizes forbidden jargon in insights", () => {
    const text = sanitizeTerritoryText("observatory governance on systemic collapse corridor");
    expect(text.toLowerCase()).not.toContain("observatory");
    expect(text.toLowerCase()).not.toContain("governance");
    expect(text.toLowerCase()).not.toContain("systemic");
  });

  it("builds deterministic opportunities", () => {
    const opps = buildOpportunities([...PRODUCER_REGIONS], null);
    expect(opps.some((o) => o.text.includes("Korhogo"))).toBe(true);
    expect(opps.some((o) => o.text.includes("San Pedro"))).toBe(true);
    expect(opps.some((o) => o.text.includes("Corridor Sud"))).toBe(true);
  });

  it("virtualized distributor table renders headers", async () => {
    render(<ProducerTerritoryDistributionWorkspace />);
    fireEvent.click(screen.getByTestId("territory-tab-distributors"));
    await waitFor(() => {
      expect(screen.getByTestId("territory-distributor-virtual-list")).toBeTruthy();
      expect(screen.getByText("Distributeur")).toBeTruthy();
    });
  });

  it("places territory pole after catalog in navigation", () => {
    const idx = PRODUCER_POLE_NAV.findIndex((p) => p.id === "catalog-products");
    expect(PRODUCER_POLE_NAV[idx + 1]?.id).toBe("territory-distribution");
    render(<ProducerPoleNav activePole="territory-distribution" onSelect={vi.fn()} />);
    expect(screen.getByTestId("producer-nav-territory-distribution")).toBeTruthy();
  });
});
