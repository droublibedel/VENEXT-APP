import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { ProducerPoleNav } from "../navigation/ProducerPoleNav";
import { PRODUCER_POLE_NAV } from "../navigation/producer-navigation.config";
import { PRODUCER_PRODUCT_SIGNALS } from "../mocks/industrial-mock-data";
import { ProducerMarketingActivationWorkspace } from "./ProducerMarketingActivationWorkspace";
import {
  buildActivationOpportunities,
  sanitizeMarketingText,
} from "./producer-marketing.viewmodel";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_marketing_activation_workspace_enabled: true,
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

describe("producer marketing activation workspace", () => {
  it("renders workspace and navigation tabs", async () => {
    render(<ProducerMarketingActivationWorkspace />);
    expect(screen.getByTestId("producer-dashboard-marketing-activation-workspace")).toBeTruthy();
    expect(screen.getByTestId("marketing-workspace-tabs")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("producer-activation-overview-panel")).toBeTruthy();
    });
  });

  it("mounts only one panel at a time", async () => {
    render(<ProducerMarketingActivationWorkspace />);
    await waitFor(() => screen.getByTestId("producer-activation-overview-panel"));
    fireEvent.click(screen.getByTestId("marketing-tab-territory"));
    await waitFor(() => {
      expect(screen.getByTestId("producer-activation-territory-panel")).toBeTruthy();
      expect(screen.getByTestId("marketing-activation-map")).toBeTruthy();
    });
    expect(screen.queryByTestId("producer-activation-overview-panel")).toBeNull();
  });

  it("shows fallback when API fails", async () => {
    render(<ProducerMarketingActivationWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-fallback")).toBe("true");
      expect(screen.queryByText(/démonstration enrichies|synchronisées/i)).toBeNull();
    });
  });

  it("renders overview metrics", async () => {
    render(<ProducerMarketingActivationWorkspace />);
    await waitFor(() => {
      expect(screen.getByText("Activations en cours")).toBeTruthy();
      expect(screen.getByText("Stabilité activité")).toBeTruthy();
    });
  });

  it("sanitizes forbidden jargon in insights", () => {
    const text = sanitizeMarketingText("observatory governance synthesis systemic collapse");
    expect(text.toLowerCase()).not.toContain("observatory");
    expect(text.toLowerCase()).not.toContain("governance");
    expect(text.toLowerCase()).not.toContain("synthesis");
  });

  it("builds deterministic activation opportunities", () => {
    const products = PRODUCER_PRODUCT_SIGNALS.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      momentum: p.momentum,
      demandPressure: p.demandPressure,
    }));
    const opps = buildActivationOpportunities(products, []);
    expect(opps.some((o) => o.text.includes("Renforcer"))).toBe(true);
    expect(opps.some((o) => o.text.includes("Distributeurs actifs"))).toBe(true);
  });

  it("virtualized distributor activation table renders headers", async () => {
    render(<ProducerMarketingActivationWorkspace />);
    fireEvent.click(screen.getByTestId("marketing-tab-distributors"));
    await waitFor(() => {
      expect(screen.getByTestId("marketing-distributor-virtual-list")).toBeTruthy();
      expect(screen.getByText("Produits poussés")).toBeTruthy();
    });
  });

  it("places marketing pole after territory in navigation", () => {
    const idx = PRODUCER_POLE_NAV.findIndex((p) => p.id === "territory-distribution");
    expect(PRODUCER_POLE_NAV[idx + 1]?.id).toBe("marketing-activation-workspace");
    render(<ProducerPoleNav activePole="marketing-activation-workspace" onSelect={vi.fn()} />);
    expect(screen.getByTestId("producer-nav-marketing-activation-workspace")).toBeTruthy();
  });
});
