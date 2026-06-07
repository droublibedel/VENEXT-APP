import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import { IndustrialMapControlSystem } from "./maps/IndustrialMapControlSystem";
import { ProducerExecutiveDashboard } from "./dashboards/ProducerExecutiveDashboard";
import { ProducerAlertCenter } from "./app-shell/ProducerAlertCenter";
import { clearProducerIndustrialDataCache } from "./hooks/useProducerIndustrialLiveData";
import type { ProducerIndustrialEnvelope } from "./data/producer-industrial-data.types";
import { fallbackProducerExecutive, fallbackProducerMapControl } from "./data/producer-industrial-fallback";

const fetchMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: { producer_industrial_live_data_enabled: true, producer_industrial_web_enabled: true },
    hydrated: true,
  }),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  clearProducerIndustrialDataCache();
});

function mockAllProducerFetches(handlers: Record<string, ProducerIndustrialEnvelope<unknown>>) {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const [segment, envelope] of Object.entries(handlers)) {
      if (url.includes(`/api/producer-industrial/${segment}`)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => envelope,
        });
      }
    }
    return Promise.reject(new Error(`unmocked: ${url}`));
  });
}

describe("producer industrial live data", () => {
  it("uses live envelope when API OK", async () => {
    const liveExec = fallbackProducerExecutive();
    liveExec.dataSource = "live";
    liveExec.fallbackUsed = false;
    const liveMap = fallbackProducerMapControl();
    liveMap.dataSource = "live";
    liveMap.fallbackUsed = false;

    mockAllProducerFetches({
      executive: liveExec,
      "map-control": liveMap,
    });

    render(<ProducerExecutiveDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-source")).toBe("live");
    });
    expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-source")).toBe("live");
    expect(screen.getByTestId("producer-data-source-hint").textContent?.trim()).toBe("");
  });

  it("falls back when API fails", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    render(<ProducerExecutiveDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-source")).toBe("fallback");
    });
    expect(screen.getByTestId("producer-data-source-hint").getAttribute("data-source")).toBe("fallback");
    expect(screen.queryByText(/démonstration/i)).toBeNull();
    expect(screen.getByTestId("metric-network-stability")).toBeTruthy();
  });

  it("map accepts explicit empty state", () => {
    render(
      <IndustrialMapControlSystem
        data={{ regions: [], corridors: [] }}
        dataSource="live"
        testId="empty-map"
      />,
    );
    expect(screen.getByTestId("empty-map")).toBeTruthy();
    expect(screen.getByText(/Aucune zone cartographiée/)).toBeTruthy();
  });

  it("alert center falls back on API error", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    render(<ProducerAlertCenter />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-alert-center").getAttribute("data-fallback")).toBe("true");
    });
    expect(screen.getByText(/Retard livraison/)).toBeTruthy();
  });

  it("executive dashboard loads via BFF hooks", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    render(<ProducerExecutiveDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-dashboard-executive")).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalled();
  });
});
