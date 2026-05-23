/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrossisteAAppShell } from "../../app-shell/GrossisteAAppShell";
import { clearGrossisteADataCache } from "../../hooks/useGrossisteALiveData";
import { GROSSISTE_A_NAV } from "../../navigation/grossiste-a-navigation.config";
import {
  mockGrossisteAIntelligence,
  mockGrossisteANetwork,
  mockGrossisteAOrders,
  mockGrossisteAOverview,
} from "../../mocks/grossiste-a-mock-data";
import { GrossisteAMessagingWorkspace } from "./GrossisteAMessagingWorkspace";
import { mockGrossisteACatalog } from "../../mocks/grossiste-a-mock-data";
import { buildGrossisteAMessagingInjected } from "./grossiste-a-messaging-adapter";
import { grossisteAProductConversationSettings } from "./grossiste-a-product-conversation-settings";
import {
  buildGrossisteConversationSignals,
  buildGrossisteOrderHints,
  buildGrossistePartnerHints,
  GROSSISTE_A_QUICK_SUGGESTIONS,
  sanitizeGrossisteMessagingText,
} from "./grossiste-a-messaging-intelligence";

vi.mock("../../hooks/useGrossisteAFeatureFlags", () => ({
  useGrossisteAFeatureFlags: () => ({
    flags: {
      grossiste_a_web_enabled: true,
      grossiste_a_live_data_enabled: false,
      grossiste_a_commerce_messaging_enabled: true,
      commerce_conversation_governance_enabled: true,
    },
    hydrated: true,
  }),
}));

describe("grossiste A commerce messaging", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearGrossisteADataCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("exposes Messagerie nav after Réseau and before Commandes", () => {
    const keys = GROSSISTE_A_NAV.map((n) => n.key);
    expect(keys.indexOf("network")).toBeLessThan(keys.indexOf("commerce-messaging"));
    expect(keys.indexOf("commerce-messaging")).toBeLessThan(keys.indexOf("orders"));
    const item = GROSSISTE_A_NAV.find((n) => n.key === "commerce-messaging");
    expect(item?.label).toBe("Messagerie");
    expect(item?.icon).toBe("messages");
  });

  it("navigates to messaging workspace from app shell", async () => {
    render(<GrossisteAAppShell />);
    fireEvent.click(screen.getByTestId("ga-nav-commerce-messaging"));
    await waitFor(() => expect(screen.getByTestId("ga-workspace-messaging")).toBeTruthy());
    expect(screen.getByTestId("grossiste-a-commerce-messaging")).toBeTruthy();
  });

  it("renders commerce conversation shell", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    await waitFor(() => expect(screen.getByTestId("grossiste-a-commerce-messaging")).toBeTruthy());
    expect(screen.getByTestId("cm-conversation-sidebar")).toBeTruthy();
  });

  it("lists grossiste partner conversations", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conversation-list")).toBeTruthy());
    expect(screen.getByTestId("cm-conv-ga-msg-pt1")).toBeTruthy();
  });

  it("renders message thread for active conversation", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-message-thread")).toBeTruthy());
    expect(screen.getAllByTestId(/^cm-msg-/).length).toBeGreaterThan(0);
  });

  it("shows product context card from adapted data", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-product-context")).toBeTruthy());
    const card = screen.getByTestId("cm-product-context");
    expect(card.textContent).toMatch(/Huile 1L/);
  });

  it("shows order context when conversation is linked to a commande", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-order-context")).toBeTruthy());
    const card = screen.getByTestId("cm-order-context");
    expect(card.textContent).toMatch(/Distributeur Plateau|Semi-grossiste Nord/);
  });

  it("shows fallback demonstration badge on mock data", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    await waitFor(() => {
      const badge = screen.getByTestId("cm-data-source");
      expect(badge.getAttribute("data-fallback")).toBe("true");
    });
  });

  it("surfaces discrete intelligence hints", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    await waitFor(() => {
      const hints = screen.queryAllByTestId("cm-intelligence-hint");
      expect(hints.length).toBeGreaterThan(0);
    });
    const combined = screen
      .queryAllByTestId("cm-intelligence-hint")
      .map((el) => el.textContent ?? "")
      .join(" ");
    expect(combined).toMatch(/Bouaké|préparation|actif|corridor|Axe nord|inhabituelle|réponse/i);
  });

  it("renders contextual quick suggestions in composer", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    // Default ga-msg-pt1 links order "preparation" → readonly scope hides composer (20.60).
    await waitFor(() => expect(screen.getByTestId("cm-conv-ga-msg-pt2")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-ga-msg-pt2"));
    await waitFor(() => expect(screen.getByTestId("cm-message-composer")).toBeTruthy());
    const chips = screen.queryAllByTestId(/^cm-suggestion-/);
    expect(chips.length).toBeGreaterThan(0);
    const labels = chips.map((el) => el.textContent ?? "").join(" ");
    expect(labels).toMatch(/Produit disponible|Stock limité|confirmation/i);
  });

  it("sanitizes forbidden jargon in messaging intelligence", () => {
    expect(sanitizeGrossisteMessagingText("governance observatory chatbot")).not.toMatch(
      /governance|observatory|chatbot/i,
    );
  });

  it("builds adapter injected payload with commerce contexts", () => {
    const injected = buildGrossisteAMessagingInjected({
      overview: mockGrossisteAOverview(),
      network: mockGrossisteANetwork(),
      orders: mockGrossisteAOrders(),
      intelligence: mockGrossisteAIntelligence(),
      dataSource: "fallback",
      fallbackUsed: true,
      loading: false,
      onRefresh: () => {},
    });
    expect(injected.conversations.length).toBeGreaterThan(0);
    const id = injected.conversations[0]!.id;
    expect(injected.getMessages(id).length).toBeGreaterThan(0);
    expect(injected.quickSuggestions).toEqual(GROSSISTE_A_QUICK_SUGGESTIONS);
  });

  it("shows governance account panel when enabled", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-account-governance")).toBeTruthy());
  });

  it("shows governance badge on active conversation", async () => {
    render(<GrossisteAMessagingWorkspace enabled />);
    await waitFor(() =>
      expect(screen.getByTestId("cm-conversation-governance-badge")).toBeTruthy(),
    );
  });

  it("maps imported products as negotiable in grossiste settings", () => {
    const imported = mockGrossisteACatalog().products.find(
      (p) => p.category === "produits importés",
    )!;
    expect(grossisteAProductConversationSettings(imported).conversationMode).toBe("NEGOTIABLE");
  });

  it("maps slow demand products as fixed price", () => {
    const s = grossisteAProductConversationSettings({
      id: "x",
      name: "Test",
      category: "riz",
      availability: "Disponible",
      rotation: "Lente",
      demand: "slow",
      networkCoverage: "Large",
    });
    expect(s.conversationMode).toBe("FIXED_PRICE_ONLY");
  });

  it("builds partner and order hints without social wording", () => {
    const partnerHints = buildGrossistePartnerHints(mockGrossisteANetwork());
    const orderHints = buildGrossisteOrderHints(mockGrossisteAOrders());
    const signals = buildGrossisteConversationSignals(
      mockGrossisteAOverview(),
      mockGrossisteAIntelligence(),
    );
    const all = [...partnerHints, ...orderHints, ...signals].map((h) => h.text).join(" ");
    expect(all).not.toMatch(/like|emoji|story|online|chatbot/i);
    expect(all.length).toBeGreaterThan(0);
  });
});
