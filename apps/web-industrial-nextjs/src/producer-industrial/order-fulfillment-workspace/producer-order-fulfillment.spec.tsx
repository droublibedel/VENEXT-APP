import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { ProducerOrderFulfillmentWorkspace } from "./ProducerOrderFulfillmentWorkspace";
import { buildOperationalInsights } from "./producer-order-fulfillment.viewmodel";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_order_fulfillment_workspace_enabled: true,
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

describe("producer order fulfillment workspace", () => {
  it("renders workspace and tabs", async () => {
    render(<ProducerOrderFulfillmentWorkspace />);
    expect(screen.getByTestId("producer-dashboard-order-fulfillment")).toBeTruthy();
    expect(screen.getByTestId("order-fulfillment-tabs")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("producer-orders-overview-panel")).toBeTruthy();
    });
  });

  it("navigates between panels", async () => {
    render(<ProducerOrderFulfillmentWorkspace />);
    await waitFor(() => screen.getByTestId("producer-orders-overview-panel"));
    fireEvent.click(screen.getByTestId("fulfillment-tab-corridors"));
    await waitFor(() => {
      expect(screen.getByTestId("producer-corridor-execution-panel")).toBeTruthy();
      expect(screen.getByTestId("fulfillment-corridor-map")).toBeTruthy();
    });
  });

  it("shows fallback data when API fails", async () => {
    render(<ProducerOrderFulfillmentWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-fallback")).toBe("true");
      expect(screen.queryByText(/démonstration enrichies|synchronisées/i)).toBeNull();
    });
  });

  it("sanitizes technical jargon in insights", () => {
    const insights = buildOperationalInsights(
      {
        insights: [
          {
            id: "x",
            severity: "high",
            title: "observatory pressure",
            detail: "governance instability on corridor",
          },
        ],
      },
      null,
      null,
      null,
    );
    const text = insights.map((i) => i.text).join(" ").toLowerCase();
    expect(text).not.toContain("observatory");
    expect(text).not.toContain("governance instability");
  });

  it("uses business language in orders panel", async () => {
    render(<ProducerOrderFulfillmentWorkspace />);
    await waitFor(() => {
      expect(screen.getByText("Commandes actives")).toBeTruthy();
      expect(screen.getByText("Corridor à risque")).toBeTruthy();
    });
  });
});
