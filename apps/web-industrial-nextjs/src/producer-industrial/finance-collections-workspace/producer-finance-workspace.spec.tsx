import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { ProducerPoleNav } from "../navigation/ProducerPoleNav";
import { PRODUCER_POLE_NAV } from "../navigation/producer-navigation.config";
import { ProducerFinanceCollectionsWorkspace } from "./ProducerFinanceCollectionsWorkspace";
import { buildFinanceInsights, sanitizeFinanceText } from "./producer-finance.viewmodel";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_finance_collections_workspace_enabled: true,
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

describe("producer finance collections workspace", () => {
  it("renders workspace and navigation tabs", async () => {
    render(<ProducerFinanceCollectionsWorkspace />);
    expect(screen.getByTestId("producer-dashboard-finance-collections-workspace")).toBeTruthy();
    expect(screen.getByTestId("finance-workspace-tabs")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("producer-finance-overview-panel")).toBeTruthy();
    });
  });

  it("mounts only one panel at a time", async () => {
    render(<ProducerFinanceCollectionsWorkspace />);
    await waitFor(() => screen.getByTestId("producer-finance-overview-panel"));
    fireEvent.click(screen.getByTestId("finance-tab-revenue"));
    await waitFor(() => {
      expect(screen.getByTestId("producer-revenue-distribution-panel")).toBeTruthy();
      expect(screen.getByTestId("finance-revenue-map")).toBeTruthy();
    });
    expect(screen.queryByTestId("producer-finance-overview-panel")).toBeNull();
  });

  it("shows fallback when API fails", async () => {
    render(<ProducerFinanceCollectionsWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-fallback")).toBe("true");
      expect(screen.queryByText(/démonstration enrichies|synchronisées/i)).toBeNull();
    });
  });

  it("renders overview metrics", async () => {
    render(<ProducerFinanceCollectionsWorkspace />);
    await waitFor(() => {
      expect(screen.getByText("Stabilité encaissements")).toBeTruthy();
      expect(screen.getByText("Flux entrants")).toBeTruthy();
    });
  });

  it("sanitizes forbidden jargon in insights", () => {
    const text = sanitizeFinanceText(
      "observatory governance synthesis executive escalation systemic collapse",
    );
    expect(text.toLowerCase()).not.toContain("observatory");
    expect(text.toLowerCase()).not.toContain("governance");
    expect(text.toLowerCase()).not.toContain("executive escalation");
  });

  it("builds deterministic finance insights", () => {
    const insights = buildFinanceInsights(null, null, [], null, null);
    expect(insights.some((i) => i.line1.includes("Opportunité"))).toBe(true);
  });

  it("virtualized collections table renders headers", async () => {
    render(<ProducerFinanceCollectionsWorkspace />);
    fireEvent.click(screen.getByTestId("finance-tab-collections"));
    await waitFor(() => {
      expect(screen.getByTestId("finance-collections-virtual-list")).toBeTruthy();
      expect(screen.getByText("Partenaire")).toBeTruthy();
    });
  });

  it("filters collections by stability", async () => {
    render(<ProducerFinanceCollectionsWorkspace />);
    fireEvent.click(screen.getByTestId("finance-tab-collections"));
    await waitFor(() => screen.getByTestId("finance-filter-stability"));
    fireEvent.change(screen.getByTestId("finance-filter-stability"), {
      target: { value: "high" },
    });
    expect(screen.getByTestId("finance-collections-virtual-list")).toBeTruthy();
  });

  it("places finance pole after supply in navigation", () => {
    const idx = PRODUCER_POLE_NAV.findIndex((p) => p.id === "supply-logistics-workspace");
    expect(PRODUCER_POLE_NAV[idx + 1]?.id).toBe("finance-collections-workspace");
    render(<ProducerPoleNav activePole="finance-collections-workspace" onSelect={vi.fn()} />);
    expect(screen.getByTestId("producer-nav-finance-collections-workspace")).toBeTruthy();
  });
});
