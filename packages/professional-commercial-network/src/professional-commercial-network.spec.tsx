/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfessionalCommercialNetworkShell } from "./ProfessionalCommercialNetworkShell";
import {
  buildProfessionalActivityHints,
  buildProfessionalNetworkHints,
  buildProfessionalRelationshipSignals,
  sanitizeProfessionalNetworkText,
} from "./professional-commercial-network-intelligence";
import {
  isProfessionalNetworkRole,
  resolveProfessionalNetworkGovernance,
} from "./professional-commercial-network-governance";
import { buildProfessionalNetworkView } from "./professional-commercial-network.viewmodel";

afterEach(() => cleanup());

describe("professional commercial network (20.69)", () => {
  it("renders shell for producteur", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{
          professional_commercial_network_enabled: true,
          producer_partner_network_enabled: true,
        }}
      />,
    );
    expect(screen.getByTestId("professional-commercial-network-shell")).toBeTruthy();
  });

  it("renders shell for grossiste A", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="grossiste_a"
        flags={{
          professional_commercial_network_enabled: true,
          grossiste_a_partner_network_enabled: true,
        }}
      />,
    );
    expect(screen.getByTestId("professional-commercial-network-shell")).toBeTruthy();
  });

  it("virtualized partner directory", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    expect(screen.getByTestId("pcn-partner-virtual-list")).toBeTruthy();
  });

  it("closed network notice", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    expect(screen.getByText(/Réseau fermé/i)).toBeTruthy();
  });

  it("invitation panel", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-invitation"));
    expect(screen.getByTestId("pcn-invitation-panel")).toBeTruthy();
    expect(screen.getByTestId("pcn-invite-send")).toBeTruthy();
  });

  it("validation panel explicit", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="grossiste_a"
        flags={{ professional_commercial_network_enabled: true, grossiste_a_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-validation"));
    expect(screen.getByTestId("pcn-validation-panel")).toBeTruthy();
    expect(screen.getByTestId("pcn-validate-partner")).toBeTruthy();
  });

  it("validate partner callback", () => {
    const onValidate = vi.fn();
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
        injected={{
          view: buildProfessionalNetworkView("producteur"),
          dataSource: "fallback",
          fallbackUsed: true,
          loading: false,
          error: null,
          onValidate,
        }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-partner-row-pp-2"));
    fireEvent.click(screen.getByTestId("pcn-tab-validation"));
    fireEvent.click(screen.getByTestId("pcn-validate-partner"));
    expect(onValidate).toHaveBeenCalledWith("pp-2");
  });

  it("documents panel supports commercial formats", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-documents"));
    expect(screen.getByTestId("pcn-doc-doc-1")).toBeTruthy();
  });

  it("territory panel", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-territory"));
    expect(screen.getByTestId("pcn-territory-panel")).toBeTruthy();
    expect(screen.getByTestId("pcn-active-zones")).toBeTruthy();
  });

  it("mail panel mail-first", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-mail"));
    expect(screen.getByTestId("pcn-mail-panel")).toBeTruthy();
    expect(screen.getByText(/Mail-first/i)).toBeTruthy();
  });

  it("linked commerce in mail panel", async () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-mail"));
    await waitFor(() => {
      expect(screen.getByTestId("pcn-mail-linked-commerce")).toBeTruthy();
      expect(screen.getByTestId("pcn-linked-context")).toBeTruthy();
    });
  });

  it("orders and settlements panels", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="grossiste_a"
        flags={{ professional_commercial_network_enabled: true, grossiste_a_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-orders"));
    expect(screen.getByTestId("pcn-orders-panel")).toBeTruthy();
    fireEvent.click(screen.getByTestId("pcn-tab-settlements"));
    expect(screen.getByTestId("pcn-settlements-panel")).toBeTruthy();
  });

  it("agreements panel", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-agreements"));
    expect(screen.getByTestId("pcn-agreements-panel")).toBeTruthy();
  });

  it("insights panel", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-insights"));
    expect(screen.getByTestId("pcn-insights-panel")).toBeTruthy();
  });

  it("anti jargon sanitization", () => {
    expect(sanitizeProfessionalNetworkText("chatbot scoring linkedin")).not.toMatch(/chatbot|linkedin/i);
  });

  it("governance requires invitation and validation", () => {
    const g = resolveProfessionalNetworkGovernance("producteur", {
      professional_commercial_network_enabled: true,
      producer_partner_network_enabled: true,
    });
    expect(g.invitationRequired).toBe(true);
    expect(g.validationRequired).toBe(true);
    expect(g.autoAcceptForbidden).toBe(true);
  });

  it("governance restricted catalog", () => {
    const g = resolveProfessionalNetworkGovernance("grossiste_a", {
      professional_commercial_network_enabled: true,
      grossiste_a_partner_network_enabled: true,
    });
    expect(g.restrictedCatalog).toBe(true);
  });

  it("disabled when flag off", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: false }}
      />,
    );
    expect(screen.getByTestId("pcn-network-disabled")).toBeTruthy();
  });

  it("no whatsapp social wording", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/followers|likes|fil d'actualité/i);
    expect(body).toMatch(/validation|invitation|professionnel/i);
  });

  it("formal roles only", () => {
    expect(isProfessionalNetworkRole("producteur")).toBe(true);
    expect(isProfessionalNetworkRole("grossiste_a")).toBe(true);
    expect(isProfessionalNetworkRole("grossiste_b")).toBe(false);
  });

  it("relationship signals", () => {
    const view = buildProfessionalNetworkView("producteur");
    expect(buildProfessionalRelationshipSignals(view.partners).length).toBeGreaterThan(0);
  });

  it("network hints professional tone", () => {
    const hints = buildProfessionalNetworkHints(buildProfessionalNetworkView("grossiste_a"));
    const text = hints.map((h) => h.text).join(" ");
    expect(text).not.toMatch(/compatibilité|observatory/i);
  });

  it("activity hints", () => {
    expect(buildProfessionalActivityHints(buildProfessionalNetworkView("producteur")).length).toBe(2);
  });

  it("manual refresh button", () => {
    const onRefresh = vi.fn();
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
        injected={{
          view: buildProfessionalNetworkView("producteur"),
          dataSource: "fallback",
          fallbackUsed: true,
          loading: false,
          error: null,
          onRefresh,
        }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-refresh"));
    expect(onRefresh).toHaveBeenCalled();
  });

  it("select partner switches panel context", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-partner-row-pp-3"));
    expect(screen.getByTestId("pcn-panel-active-invitation")).toBeTruthy();
  });

  it("fallback data source label", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    expect(screen.getByTestId("pcn-data-source")).toBeTruthy();
  });

  it("separation from terrain auto accept in copy", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    expect(screen.getByText(/aucune auto-connexion terrain/i)).toBeTruthy();
  });

  it("mail thread list", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-mail"));
    expect(screen.getByTestId("pcn-mail-thread-mail-1")).toBeTruthy();
  });

  it("one active panel at a time", () => {
    render(
      <ProfessionalCommercialNetworkShell
        actorRole="producteur"
        flags={{ professional_commercial_network_enabled: true, producer_partner_network_enabled: true }}
      />,
    );
    fireEvent.click(screen.getByTestId("pcn-tab-documents"));
    expect(screen.getByTestId("pcn-panel-active-documents")).toBeTruthy();
    expect(screen.queryByTestId("pcn-panel-active-mail")).toBeNull();
  });
});
