import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { ProducerCatalogWorkspace } from "./ProducerCatalogWorkspace";
import { buildRecommendations, sanitizeCatalogText } from "./producer-catalog.viewmodel";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_catalog_workspace_enabled: true,
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

describe("producer catalog workspace", () => {
  it("renders workspace and navigation tabs", async () => {
    render(<ProducerCatalogWorkspace />);
    expect(screen.getByTestId("producer-dashboard-catalog-products")).toBeTruthy();
    expect(screen.getByTestId("catalog-workspace-tabs")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("producer-catalog-overview-panel")).toBeTruthy();
    });
  });

  it("mounts only one panel at a time", async () => {
    render(<ProducerCatalogWorkspace />);
    await waitFor(() => screen.getByTestId("producer-catalog-overview-panel"));
    fireEvent.click(screen.getByTestId("catalog-tab-territory"));
    await waitFor(() => {
      expect(screen.getByTestId("producer-territory-coverage-panel")).toBeTruthy();
      expect(screen.getByTestId("catalog-territory-map")).toBeTruthy();
    });
    expect(screen.queryByTestId("producer-catalog-overview-panel")).toBeNull();
  });

  it("shows fallback when API fails", async () => {
    render(<ProducerCatalogWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-fallback")).toBe("true");
      expect(screen.queryByText(/démonstration enrichies|synchronisées/i)).toBeNull();
    });
  });

  it("renders overview metrics", async () => {
    render(<ProducerCatalogWorkspace />);
    await waitFor(() => {
      expect(screen.getByText("Produits actifs")).toBeTruthy();
      expect(screen.getByText("Stabilité catalogue")).toBeTruthy();
    });
  });

  it("sanitizes forbidden jargon in insights", () => {
    const text = sanitizeCatalogText("observatory pressure on governance corridor");
    expect(text.toLowerCase()).not.toContain("observatory");
    expect(text.toLowerCase()).not.toContain("governance");
  });

  it("builds deterministic recommendations", () => {
    const recs = buildRecommendations(
      [
        {
          id: "1",
          product: "Huile",
          category: "Agro",
          rotation: "rapide",
          demand: 80,
          availability: "moyenne",
          growth: "Hausse",
          cityCoverage: 3,
          status: "tension",
        },
      ],
      null,
      { tensionZones: 2 } as never,
    );
    expect(recs.some((r) => r.text.includes("surveiller"))).toBe(true);
    expect(recs.some((r) => r.text.includes("Disponibilité insuffisante"))).toBe(true);
  });

  it("virtualized product table renders headers", async () => {
    render(<ProducerCatalogWorkspace />);
    fireEvent.click(screen.getByTestId("catalog-tab-performance"));
    await waitFor(() => {
      expect(screen.getByTestId("catalog-product-virtual-list")).toBeTruthy();
      expect(screen.getByText("Produit")).toBeTruthy();
    });
  });
});
