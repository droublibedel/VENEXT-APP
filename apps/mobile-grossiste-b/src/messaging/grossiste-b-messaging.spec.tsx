/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrossisteBAppShell } from "../app-shell/GrossisteBAppShell";
import { clearGrossisteDataCache } from "../hooks/useGrossisteLiveData";
import { GROSSISTE_B_BOTTOM_TABS } from "../navigation/grossiste-b-navigation.config";
import {
  mockGrossisteActivity,
  mockGrossisteCatalog,
  mockGrossisteNetwork,
  mockGrossisteOrders,
} from "../mocks/grossiste-b-mock-data";
import { GrossisteBMessagingScreen } from "./GrossisteBMessagingScreen";
import {
  buildGrossisteBMessagingInjected,
  grossisteBOrderGovernance,
} from "./grossiste-b-messaging-adapter";
import {
  buildGrossisteBConversationHints,
  buildGrossisteBDemandSignals,
  buildGrossisteBPartnerSignals,
  GROSSISTE_B_QUICK_SUGGESTIONS,
  sanitizeGrossisteBMessagingText,
} from "./grossiste-b-messaging-intelligence";

vi.mock("../hooks/useGrossisteFeatureFlags", () => ({
  useGrossisteFeatureFlags: () => ({
    flags: {
      grossiste_b_mobile_enabled: true,
      grossiste_b_live_data_enabled: false,
      grossiste_b_commerce_messaging_enabled: true,
      commerce_conversation_governance_enabled: true,
      terrain_quick_onboarding_enabled: false,
    },
    hydrated: true,
  }),
}));

describe("grossiste B commerce messaging", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearGrossisteDataCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("exposes Messagerie in terrain header, not bottom tabs", () => {
    expect(GROSSISTE_B_BOTTOM_TABS).toHaveLength(4);
    expect(GROSSISTE_B_BOTTOM_TABS.find((t) => t.id === "network")).toBeTruthy();
  });

  it("renders terrain header with messaging action", () => {
    render(<GrossisteBAppShell />);
    expect(screen.getByTestId("venext-terrain-mobile-header-messaging")).toBeTruthy();
    expect(screen.queryByTestId("grossiste-tab-messaging")).toBeNull();
  });

  it("navigates to messaging screen from header", async () => {
    render(<GrossisteBAppShell />);
    fireEvent.click(screen.getByTestId("venext-terrain-mobile-header-messaging"));
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-messaging")).toBeTruthy());
    expect(screen.getByTestId("grossiste-b-commerce-messaging")).toBeTruthy();
  });

  it("renders commerce conversation shell on messaging screen", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("grossiste-b-commerce-messaging")).toBeTruthy());
    expect(screen.getByTestId("cm-conversation-sidebar")).toBeTruthy();
  });

  it("lists grossiste partner conversations in mobile sidebar", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conversation-list")).toBeTruthy());
    expect(screen.getByTestId("cm-conv-gb-msg-pt1")).toBeTruthy();
  });

  it("opens full-screen thread after selecting a conversation", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-gb-msg-pt1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-gb-msg-pt1"));
    await waitFor(() => expect(screen.getByTestId("cm-message-thread")).toBeTruthy());
    expect(screen.getByTestId("cm-mobile-back")).toBeTruthy();
  });

  it("returns to conversation list via mobile back control", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-gb-msg-pt1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-gb-msg-pt1"));
    await waitFor(() => expect(screen.getByTestId("cm-mobile-back")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-mobile-back"));
    await waitFor(() => expect(screen.getByTestId("cm-conversation-list")).toBeTruthy());
  });

  it("shows product context after opening a thread", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-gb-msg-pt1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-gb-msg-pt1"));
    await waitFor(() => expect(screen.getByTestId("cm-product-context")).toBeTruthy());
    expect(screen.getByTestId("cm-product-context").textContent).toMatch(/Huile|Riz|Eau/i);
  });

  it("shows order context for commande-linked conversation", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-gb-msg-pt1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-gb-msg-pt1"));
    await waitFor(() => expect(screen.getByTestId("cm-order-context")).toBeTruthy());
    expect(screen.getByTestId("cm-order-context").textContent).toMatch(/Boutique Plateau|Semi-grossiste/i);
  });

  it("shows fallback demonstration badge on mock data", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => {
      const badge = screen.getByTestId("cm-data-source");
      expect(badge.getAttribute("data-fallback")).toBe("true");
    });
  });

  it("surfaces discrete intelligence hints in thread", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-gb-msg-pt1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-gb-msg-pt1"));
    await waitFor(() => {
      const hints = screen.queryAllByTestId("cm-intelligence-hint");
      expect(hints.length).toBeGreaterThan(0);
    });
    const combined = screen
      .queryAllByTestId("cm-intelligence-hint")
      .map((el) => el.textContent ?? "")
      .join(" ");
    expect(combined).toMatch(/Bouaké|demandé|corridor|réactif|Livraison/i);
  });

  it("renders mobile composer quick suggestions", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-gb-msg-product-pr2")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-gb-msg-product-pr2"));
    await waitFor(() => {
      const composer =
        screen.queryByTestId("cm-message-composer") ?? screen.queryByTestId("cm-composer-hidden");
      expect(composer).toBeTruthy();
      if (composer?.getAttribute("data-testid") === "cm-message-composer") {
        expect(composer.getAttribute("data-variant")).toBe("mobile");
      }
    });
    const chips = screen.queryAllByTestId(/^cm-suggestion-/);
    expect(chips.length).toBeGreaterThan(0);
  });

  it("shows governance badge on active conversation thread", async () => {
    render(<GrossisteBMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-gb-msg-pt1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-gb-msg-pt1"));
    await waitFor(() =>
      expect(screen.getByTestId("cm-conversation-governance-badge")).toBeTruthy(),
    );
  });

  it("sanitizes forbidden jargon in messaging intelligence", () => {
    expect(sanitizeGrossisteBMessagingText("governance observatory chatbot websocket")).not.toMatch(
      /governance|observatory|chatbot|websocket/i,
    );
  });

  it("builds adapter injected payload with commerce contexts", () => {
    const injected = buildGrossisteBMessagingInjected({
      activity: mockGrossisteActivity(),
      catalog: mockGrossisteCatalog(),
      orders: mockGrossisteOrders(),
      network: mockGrossisteNetwork(),
      governanceEnabled: true,
      dataSource: "fallback",
      fallbackUsed: true,
      loading: false,
      onRefresh: () => {},
    });
    expect(injected.conversations.length).toBeGreaterThan(0);
    const id = injected.conversations[0]!.id;
    expect(injected.getMessages(id).length).toBeGreaterThan(0);
    expect(injected.quickSuggestions).toEqual(GROSSISTE_B_QUICK_SUGGESTIONS);
  });

  it("maps delivery orders to order-context governance", () => {
    const delivery = mockGrossisteOrders().received.find((o) => o.status === "delivery")!;
    expect(grossisteBOrderGovernance(delivery).conversationMode).toBe("ORDER_CONTEXT_ONLY");
  });

  it("maps limited stock products as fixed price in adapter settings", () => {
    const limited = mockGrossisteCatalog().products.find((p) => p.availability === "limited")!;
    const injected = buildGrossisteBMessagingInjected({
      activity: mockGrossisteActivity(),
      catalog: mockGrossisteCatalog(),
      orders: mockGrossisteOrders(),
      network: mockGrossisteNetwork(),
      governanceEnabled: true,
      dataSource: "fallback",
      fallbackUsed: true,
      loading: false,
      onRefresh: () => {},
    });
    const convId = `gb-msg-product-${limited.id}`;
    expect(injected.getProductConversationSettings?.(convId)?.conversationMode).toBe(
      "FIXED_PRICE_ONLY",
    );
    const productConv = injected.conversations.find((c) => c.id === convId);
    expect(productConv?.conversationMode).toBe("FIXED_PRICE_ONLY");
  });

  it("builds partner and demand signals without social wording", () => {
    const partnerHints = buildGrossisteBPartnerSignals(mockGrossisteNetwork());
    const demandHints = buildGrossisteBDemandSignals(mockGrossisteCatalog(), mockGrossisteActivity());
    const convHints = buildGrossisteBConversationHints(mockGrossisteActivity());
    const all = [...partnerHints, ...demandHints, ...convHints].map((h) => h.text).join(" ");
    expect(all).not.toMatch(/like|emoji|story|online|chatbot|social/i);
    expect(all.length).toBeGreaterThan(0);
  });
});
