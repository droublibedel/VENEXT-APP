import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { IndustrialMapControlSystem } from "./maps/IndustrialMapControlSystem";
import { ProducerPoleNav } from "./navigation/ProducerPoleNav";
import { PRODUCER_POLE_NAV } from "./navigation/producer-navigation.config";
import { ProducerExecutiveDashboard } from "./dashboards/ProducerExecutiveDashboard";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("./dashboards/producer-dashboard-loader", () => ({
  ProducerDashboardByPole: ({ pole }: { pole: string }) => (
    <div data-testid={`producer-dashboard-${pole}`}>dashboard-{pole}</div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("producer industrial foundation", () => {
  it("renders executive dashboard metrics", () => {
    render(<ProducerExecutiveDashboard />);
    expect(screen.getByTestId("producer-dashboard-executive")).toBeTruthy();
    expect(screen.getByTestId("metric-network-stability")).toBeTruthy();
    expect(screen.getByTestId("executive-map-tension")).toBeTruthy();
  });

  it("renders map control system", () => {
    render(<IndustrialMapControlSystem testId="test-map" />);
    expect(screen.getByTestId("test-map")).toBeTruthy();
    expect(screen.getByText(/Carte opérationnelle/)).toBeTruthy();
  });

  it("pole navigation fires selection", () => {
    const onSelect = vi.fn();
    render(<ProducerPoleNav activePole="executive" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("producer-nav-commercial"));
    expect(onSelect).toHaveBeenCalledWith("commercial");
  });

  it("lazy dashboard loader resolves finance pole", async () => {
    const { ProducerDashboardByPole } = await import("./dashboards/producer-dashboard-loader");
    render(<ProducerDashboardByPole pole="finance-collections-workspace" />);
    await waitFor(() => {
      expect(screen.getByTestId("producer-dashboard-finance-collections-workspace")).toBeTruthy();
    });
  });

  it("shell renders with mocked dashboards", async () => {
    const { ProducerIndustrialAppShell } = await import("./app-shell/ProducerIndustrialAppShell");
    render(<ProducerIndustrialAppShell />);
    expect(screen.getByTestId("producer-industrial-shell")).toBeTruthy();
    expect(screen.getByTestId("producer-topbar")).toBeTruthy();
    expect(screen.getByTestId("producer-dashboard-executive")).toBeTruthy();
    fireEvent.click(screen.getByTestId("producer-nav-supply-logistics-workspace"));
    await waitFor(() => {
      expect(screen.getByTestId("producer-dashboard-supply-logistics-workspace")).toBeTruthy();
    });
  });

  it("sidebar exposes responsive layout class", () => {
    render(<ProducerPoleNav activePole="executive" onSelect={vi.fn()} />);
    const nav = screen.getByTestId("producer-pole-nav");
    expect(nav.className).toContain("producer-industrial-sidebar");
  });

  it("defines ten producer poles including workspaces", () => {
    expect(PRODUCER_POLE_NAV).toHaveLength(12);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "relational-commercial")).toBe(true);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "order-fulfillment")).toBe(true);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "producer-commercial-mail-workspace")).toBe(true);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "professional-commercial-network-workspace")).toBe(true);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "catalog-products")).toBe(true);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "territory-distribution")).toBe(true);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "marketing-activation-workspace")).toBe(true);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "supply-logistics-workspace")).toBe(true);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "finance-collections-workspace")).toBe(true);
    expect(PRODUCER_POLE_NAV.some((p) => p.id === "data-intelligence-workspace")).toBe(true);
  });
});
