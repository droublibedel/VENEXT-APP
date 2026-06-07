import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { RelationalCommercialWorkspace } from "./RelationalCommercialWorkspace";
import { buildHumanInsights } from "./relational-commercial-view-model";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_relational_commercial_workspace_enabled: true,
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

describe("relational commercial workspace", () => {
  it("renders workspace shell and tabs", async () => {
    render(<RelationalCommercialWorkspace />);
    expect(screen.getByTestId("producer-dashboard-relational-commercial")).toBeTruthy();
    expect(screen.getByTestId("relational-workspace-tabs")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("relational-partner-network-panel")).toBeTruthy();
    });
  });

  it("switches panels on tab navigation", async () => {
    render(<RelationalCommercialWorkspace />);
    await waitFor(() => screen.getByTestId("relational-partner-network-panel"));
    fireEvent.click(screen.getByTestId("relational-tab-insights"));
    await waitFor(() => {
      expect(screen.getByTestId("relational-commercial-insights-panel")).toBeTruthy();
    });
    expect(screen.queryByTestId("relational-partner-network-panel")).toBeNull();
  });

  it("shows fallback hint when API fails", async () => {
    render(<RelationalCommercialWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-fallback")).toBe("true");
      expect(screen.queryByText(/démonstration enrichies|synchronisées/i)).toBeNull();
    });
  });

  it("renders territory SVG map", async () => {
    render(<RelationalCommercialWorkspace />);
    fireEvent.click(screen.getByTestId("relational-tab-territory"));
    await waitFor(() => {
      expect(screen.getByTestId("relational-territory-svg")).toBeTruthy();
    });
  });

  it("uses human language in insights without technical jargon", () => {
    const insights = buildHumanInsights(
      {
        insights: [
          {
            id: "x",
            severity: "high",
            title: "systemic concentration",
            detail: "dependency exposure on corridor",
          },
        ],
      },
      null,
      null,
      null,
    );
    const joined = insights.map((i) => i.text).join(" ");
    expect(joined.toLowerCase()).not.toContain("systemic");
    expect(joined.toLowerCase()).not.toContain("dependency exposure");
    expect(joined.toLowerCase()).not.toContain("observatory");
  });

  it("shows partner panel with business columns", async () => {
    render(<RelationalCommercialWorkspace />);
    await waitFor(() => {
      expect(screen.getByText("Partenaire")).toBeTruthy();
      expect(screen.getByText("Corridor")).toBeTruthy();
    });
  });
});
