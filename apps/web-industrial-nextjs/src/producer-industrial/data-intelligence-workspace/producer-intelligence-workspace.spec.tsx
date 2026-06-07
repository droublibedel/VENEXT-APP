import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { clearProducerIndustrialDataCache } from "../hooks/useProducerIndustrialLiveData";
import { ProducerPoleNav } from "../navigation/ProducerPoleNav";
import { PRODUCER_POLE_NAV } from "../navigation/producer-navigation.config";
import { ProducerDataIntelligenceWorkspace } from "./ProducerDataIntelligenceWorkspace";
import {
  buildPresenceMessages,
  buildStrategicSuggestions,
  sanitizeIntelligenceText,
} from "./producer-intelligence.viewmodel";
import { PRODUCER_REGIONS } from "../mocks/industrial-mock-data";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_data_intelligence_workspace_enabled: true,
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

describe("producer data intelligence workspace", () => {
  it("renders workspace and navigation tabs", async () => {
    render(<ProducerDataIntelligenceWorkspace />);
    expect(screen.getByTestId("producer-dashboard-data-intelligence-workspace")).toBeTruthy();
    expect(screen.getByTestId("intelligence-workspace-tabs")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("producer-intelligence-overview-panel")).toBeTruthy();
    });
  });

  it("mounts only one panel at a time", async () => {
    render(<ProducerDataIntelligenceWorkspace />);
    await waitFor(() => screen.getByTestId("producer-intelligence-overview-panel"));
    fireEvent.click(screen.getByTestId("intelligence-tab-corridor"));
    await waitFor(() => {
      expect(screen.getByTestId("producer-corridor-watch-panel")).toBeTruthy();
      expect(screen.getByTestId("intelligence-corridor-map")).toBeTruthy();
    });
    expect(screen.queryByTestId("producer-intelligence-overview-panel")).toBeNull();
  });

  it("shows fallback when API fails", async () => {
    render(<ProducerDataIntelligenceWorkspace />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-fallback")).toBe("true");
      expect(screen.queryByText(/démonstration enrichies|synchronisées/i)).toBeNull();
    });
  });

  it("renders overview metrics", async () => {
    render(<ProducerDataIntelligenceWorkspace />);
    await waitFor(() => {
      expect(screen.getByText("Activité réseau observée")).toBeTruthy();
      expect(screen.getByText("Recommandations prioritaires")).toBeTruthy();
    });
  });

  it("renders intelligence presence zone", async () => {
    render(<ProducerDataIntelligenceWorkspace />);
    fireEvent.click(screen.getByTestId("intelligence-tab-presence"));
    await waitFor(() => {
      expect(screen.getByTestId("intelligence-presence-zone")).toBeTruthy();
      expect(screen.getByTestId("producer-intelligence-presence-panel")).toBeTruthy();
    });
  });

  it("sanitizes forbidden jargon", () => {
    const text = sanitizeIntelligenceText(
      "governance observatory orchestration synthesis systemic collapse executive escalation",
    );
    expect(text.toLowerCase()).not.toContain("governance");
    expect(text.toLowerCase()).not.toContain("observatory");
    expect(text.toLowerCase()).not.toContain("systemic");
  });

  it("builds deterministic strategic suggestions", () => {
    const suggestions = buildStrategicSuggestions([...PRODUCER_REGIONS], [], null, null);
    expect(suggestions.some((s) => s.text.includes("Bouaké"))).toBe(true);
    expect(suggestions.some((s) => s.text.includes("Distribution"))).toBe(true);
  });

  it("renders network signals list", async () => {
    render(<ProducerDataIntelligenceWorkspace />);
    fireEvent.click(screen.getByTestId("intelligence-tab-signals"));
    await waitFor(() => {
      expect(screen.getByTestId("intelligence-network-signals-list")).toBeTruthy();
    });
  });

  it("places intelligence pole last in navigation", () => {
    expect(PRODUCER_POLE_NAV[PRODUCER_POLE_NAV.length - 1]?.id).toBe("data-intelligence-workspace");
    render(<ProducerPoleNav activePole="data-intelligence-workspace" onSelect={vi.fn()} />);
    expect(screen.getByTestId("producer-nav-data-intelligence-workspace")).toBeTruthy();
  });

  it("builds calm presence messages", () => {
    const messages = buildPresenceMessages(
      [{ ...PRODUCER_REGIONS[2]!, growthPct: 15 }],
      [],
      null,
      null,
    );
    expect(messages.some((m) => m.text.includes("VENEXT"))).toBe(true);
    for (const m of messages) {
      expect(m.text.toLowerCase()).not.toContain("effondrement");
    }
  });
});
