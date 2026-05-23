/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommercialNetworkDiscoveryShell } from "./CommercialNetworkDiscoveryShell";
import {
  buildCommercialContactSignals,
  buildCommercialDiscoveryHints,
  sanitizeCommercialDiscoveryText,
} from "./commercial-network-discovery-intelligence";
import {
  isFormalCommercialRole,
  isTerrainCommercialRole,
  resolveCommercialDiscoveryGovernance,
} from "./commercial-network-discovery-governance";
import {
  mockCommercialDiscoveryView,
  rankContactSuggestions,
} from "./commercial-network-discovery-mock-data";
import type { CommercialContactSuggestion } from "./commercial-network-discovery.types";

afterEach(() => cleanup());

describe("commercial network discovery (20.68)", () => {
  it("renders terrain shell for grossiste B", () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_b"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    expect(screen.getByTestId("commercial-network-discovery-shell")).toBeTruthy();
    expect(screen.getByText(/Retrouver mon réseau/i)).toBeTruthy();
  });

  it("renders terrain shell for detaillant", () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="detaillant"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    expect(screen.getByTestId("commercial-network-discovery-shell")).toBeTruthy();
  });

  it("blocks formal producteur role from terrain UX", () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="producteur"
        flags={{ commercial_network_discovery_enabled: true }}
      />,
    );
    expect(screen.getByTestId("cnd-discovery-formal-only")).toBeTruthy();
  });

  it("contact sync grant reveals suggestions list", async () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_b"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("cnd-contact-sync-grant"));
    await waitFor(() => {
      expect(screen.getByTestId("cnd-contact-sync-granted")).toBeTruthy();
      expect(screen.getByTestId("cnd-suggestions-virtual-list")).toBeTruthy();
    });
  });

  it("mutual contact suggestion shows connect button", async () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="detaillant"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("cnd-contact-sync-grant"));
    await waitFor(() => expect(screen.getByTestId("cnd-connect-sug-francois")).toBeTruthy());
  });

  it("auto accept connects instantly", async () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_b"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("cnd-contact-sync-grant"));
    await waitFor(() => screen.getByTestId("cnd-connect-sug-sarah"));
    fireEvent.click(screen.getByTestId("cnd-connect-sug-sarah"));
    await waitFor(() => expect(screen.getByTestId("cnd-connected-sug-sarah")).toBeTruthy());
  });

  it("one way suggestion copy is soft", async () => {
    const view = mockCommercialDiscoveryView("grossiste_b");
    const oneWay = view.suggestions.find((s) => s.id === "sug-unknown");
    expect(oneWay?.recognitionHint ?? oneWay?.secondaryName).toMatch(/potentiel|contact/i);
  });

  it("partner preview and quick order after connect", async () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="detaillant"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("cnd-contact-sync-grant"));
    await waitFor(() => screen.getByTestId("cnd-connect-sug-francois"));
    fireEvent.click(screen.getByTestId("cnd-connect-sug-francois"));
    await waitFor(() => {
      expect(screen.getByTestId("cnd-partner-preview")).toBeTruthy();
      expect(screen.getByTestId("cnd-partner-quick-order")).toBeTruthy();
    });
  });

  it("catalog preview visible when connected", async () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_b"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("cnd-contact-sync-grant"));
    await waitFor(() => screen.getByTestId("cnd-connect-sug-sarah"));
    fireEvent.click(screen.getByTestId("cnd-connect-sug-sarah"));
    await waitFor(() => expect(screen.getByTestId("cnd-catalog-preview")).toBeTruthy());
  });

  it("virtualized suggestions list present", async () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_b"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("cnd-contact-sync-grant"));
    await waitFor(() => expect(screen.getByTestId("cnd-suggestions-virtual-list")).toBeTruthy());
  });

  it("anti jargon sanitization", () => {
    expect(sanitizeCommercialDiscoveryText("chatbot scoring 98%")).not.toMatch(/chatbot|scoring|98%/i);
  });

  it("discovery hints stay human", () => {
    const hints = buildCommercialDiscoveryHints(mockCommercialDiscoveryView("detaillant"));
    const text = hints.map((h) => h.text).join(" ");
    expect(text).not.toMatch(/compatibilité|observatory|erp/i);
  });

  it("contact signals for mutual matches", () => {
    const suggestions: CommercialContactSuggestion[] = [
      {
        id: "1",
        phone: "+225",
        displayName: "Test",
        city: "Abidjan",
        activityLabel: "Actif",
        photoInitials: "T",
        matchKind: "mutual",
        partnerStatus: "suggested",
        catalogPreviewCount: 3,
      },
    ];
    expect(buildCommercialContactSignals(suggestions).length).toBeGreaterThan(0);
  });

  it("governance terrain auto accept default", () => {
    const g = resolveCommercialDiscoveryGovernance("grossiste_b", {
      commercial_network_discovery_enabled: true,
    });
    expect(g.autoAcceptCommercialConnections).toBe(true);
    expect(g.terrainMode).toBe(true);
  });

  it("governance formal disables auto accept", () => {
    const g = resolveCommercialDiscoveryGovernance("grossiste_a", {
      commercial_network_discovery_enabled: true,
    });
    expect(g.autoAcceptCommercialConnections).toBe(false);
    expect(isFormalCommercialRole("grossiste_a")).toBe(true);
  });

  it("isTerrainCommercialRole for detaillant", () => {
    expect(isTerrainCommercialRole("detaillant")).toBe(true);
  });

  it("rankContactSuggestions orders mutual first", () => {
    const view = mockCommercialDiscoveryView("grossiste_b");
    const ranked = rankContactSuggestions(view.suggestions);
    expect(ranked[0]?.matchKind).toBe("mutual");
  });

  it("disabled when discovery flag off", () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_b"
        flags={{ commercial_network_discovery_enabled: false }}
      />,
    );
    expect(screen.getByTestId("cnd-discovery-disabled")).toBeTruthy();
  });

  it("instant connection CTA for auto accept", async () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_b"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("cnd-contact-sync-grant"));
    expect(screen.getByTestId("cnd-instant-connection")).toBeTruthy();
  });

  it("no social network wording in shell", () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="detaillant"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/followers|likes|fil d'actualité/i);
  });

  it("injected onConnect callback", async () => {
    const onConnect = vi.fn();
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_b"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
        injected={{
          view: { ...mockCommercialDiscoveryView("grossiste_b"), contactSyncGranted: true },
          dataSource: "fallback",
          fallbackUsed: true,
          loading: false,
          error: null,
          onConnect,
        }}
      />,
    );
    await waitFor(() => screen.getByTestId("cnd-connect-sug-sarah"));
    fireEvent.click(screen.getByTestId("cnd-connect-sug-sarah"));
    expect(onConnect).toHaveBeenCalledWith("sug-sarah");
  });

  it("fallback data source label", () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_b"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    expect(screen.getByTestId("cnd-data-source")).toBeTruthy();
  });

  it("insights panel renders hints", async () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="detaillant"
        flags={{ commercial_network_discovery_enabled: true, commercial_auto_accept_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("cnd-contact-sync-grant"));
    await waitFor(() => {
      expect(screen.getByTestId("cnd-discovery-insights")).toBeTruthy();
    });
  });

  it("activity boosted suggestions exist in mock", () => {
    const view = mockCommercialDiscoveryView("detaillant");
    expect(view.suggestions.some((s) => s.matchKind === "activity_boosted")).toBe(true);
  });

  it("formal mode notice for grossiste A when enabled", () => {
    render(
      <CommercialNetworkDiscoveryShell
        actorRole="grossiste_a"
        flags={{ commercial_network_discovery_enabled: true }}
      />,
    );
    expect(screen.getByTestId("cnd-discovery-formal-only")).toBeTruthy();
  });
});
