/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DetaillantAppShell } from "../app-shell/DetaillantAppShell";
import { clearDetaillantDataCache } from "../hooks/useDetaillantLiveData";
import {
  mockDetaillantHome,
  mockDetaillantNetwork,
  mockDetaillantOrders,
  mockDetaillantProducts,
} from "../mocks/detaillant-mock-data";
import { DETAILLANT_TABS } from "../navigation/detaillant-navigation.config";
import { DetaillantMessagingScreen } from "./DetaillantMessagingScreen";
import {
  buildDetaillantMessagingInjected,
  detaillantOrderGovernance,
} from "./detaillant-messaging-adapter";
import {
  buildRetailDemandSignals,
  buildRetailHints,
  buildRetailSignals,
  DETAILLANT_QUICK_SUGGESTIONS,
  sanitizeRetailMessagingText,
} from "./detaillant-messaging-intelligence";
import { detaillantProductConversationSettings } from "./detaillant-product-governance";

vi.mock("../hooks/useDetaillantFeatureFlags", () => ({
  useDetaillantFeatureFlags: () => ({
    flags: {
      detaillant_mobile_enabled: true,
      detaillant_live_data_enabled: false,
      detaillant_commerce_messaging_enabled: true,
      commerce_conversation_governance_enabled: true,
      relational_catalog_enabled: false,
      terrain_quick_onboarding_enabled: false,
    },
    hydrated: true,
  }),
}));

describe("detaillant commerce messaging", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearDetaillantDataCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("exposes Messagerie tab after Accueil and before Catalogue", () => {
    const keys = DETAILLANT_TABS.map((t) => t.key);
    expect(keys.indexOf("home")).toBeLessThan(keys.indexOf("messaging"));
    expect(keys.indexOf("messaging")).toBeLessThan(keys.indexOf("products"));
    const tab = DETAILLANT_TABS.find((t) => t.key === "messaging");
    expect(tab?.label).toBe("Messagerie");
    expect(tab?.icon).toBe("messages");
  });

  it("completes quick order flow without opening messaging", async () => {
    render(<DetaillantAppShell />);
    fireEvent.click(screen.getByTestId("detaillant-tab-products"));
    await waitFor(() => expect(screen.getByTestId("detaillant-quick-order-pr2")).toBeTruthy());
    fireEvent.click(screen.getByTestId("detaillant-quick-order-pr2"));
    fireEvent.click(screen.getByTestId("detaillant-add-cart-pr2"));
    await waitFor(() => expect(screen.getByTestId("detaillant-cart-status")).toBeTruthy());
    expect(screen.queryByTestId("detaillant-screen-messaging")).toBeNull();
    expect(screen.queryByTestId("detaillant-commerce-messaging")).toBeNull();
    fireEvent.click(screen.getByTestId("detaillant-checkout"));
    expect(screen.getByTestId("detaillant-screen-products")).toBeTruthy();
  });

  it("navigates to messaging screen when user chooses to", async () => {
    render(<DetaillantAppShell />);
    fireEvent.click(screen.getByTestId("detaillant-tab-messaging"));
    await waitFor(() => expect(screen.getByTestId("detaillant-screen-messaging")).toBeTruthy());
    expect(screen.getByTestId("detaillant-messaging-optional-note")).toBeTruthy();
  });

  it("renders commerce conversation shell", async () => {
    render(<DetaillantMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("detaillant-commerce-messaging")).toBeTruthy());
    expect(screen.getByTestId("cm-conversation-sidebar")).toBeTruthy();
  });

  it("lists supplier conversations", async () => {
    render(<DetaillantMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-dr-msg-s1")).toBeTruthy());
  });

  it("opens mobile thread on conversation select", async () => {
    render(<DetaillantMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-dr-msg-s1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-dr-msg-s1"));
    await waitFor(() => expect(screen.getByTestId("cm-message-thread")).toBeTruthy());
  });

  it("maps FIXED_PRICE_ONLY products with quick-buy actions", () => {
    const fixed = mockDetaillantProducts().products.find((p) => p.badge === "disponible")!;
    expect(detaillantProductConversationSettings(fixed).conversationMode).toBe("FIXED_PRICE_ONLY");
  });

  it("maps NEGOTIABLE products for optional discussion", () => {
    const neg = mockDetaillantProducts().products.find((p) => p.badge === "tres-demande")!;
    expect(detaillantProductConversationSettings(neg).conversationMode).toBe("NEGOTIABLE");
  });

  it("shows discuss actions only on negotiable catalogue items", async () => {
    render(<DetaillantAppShell />);
    fireEvent.click(screen.getByTestId("detaillant-tab-products"));
    await waitFor(() => expect(screen.getByTestId("detaillant-discuss-pr1")).toBeTruthy());
    expect(screen.queryByTestId("detaillant-discuss-pr2")).toBeNull();
    await waitFor(() => expect(screen.getByTestId("detaillant-quick-order-pr2")).toBeTruthy());
  });

  it("maps delivery orders to ORDER_CONTEXT_ONLY governance", () => {
    const delivery = mockDetaillantOrders().recues.find((o) => o.status === "livraison")!;
    expect(detaillantOrderGovernance(delivery).conversationMode).toBe("ORDER_CONTEXT_ONLY");
  });

  it("shows fallback demonstration badge", async () => {
    render(<DetaillantMessagingScreen enabled />);
    await waitFor(() => {
      expect(screen.getByTestId("cm-data-source").getAttribute("data-fallback")).toBe("true");
    });
  });

  it("renders mobile composer suggestions in thread", async () => {
    render(<DetaillantMessagingScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("cm-conv-dr-msg-product-pr1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-dr-msg-product-pr1"));
    await waitFor(() => {
      const composer = screen.getByTestId("cm-message-composer");
      expect(composer.getAttribute("data-variant")).toBe("mobile");
    });
    expect(screen.queryAllByTestId(/^cm-suggestion-/).length).toBeGreaterThan(0);
  });

  it("sanitizes forbidden jargon in retail intelligence", () => {
    expect(sanitizeRetailMessagingText("governance chatbot websocket social")).not.toMatch(
      /governance|chatbot|websocket|social/i,
    );
  });

  it("builds injected adapter with quick suggestions", () => {
    const injected = buildDetaillantMessagingInjected({
      home: mockDetaillantHome(),
      products: mockDetaillantProducts(),
      orders: mockDetaillantOrders(),
      network: mockDetaillantNetwork(),
      governanceEnabled: true,
      dataSource: "fallback",
      fallbackUsed: true,
      loading: false,
      onRefresh: () => {},
    });
    expect(injected.conversations.length).toBeGreaterThan(0);
    expect(injected.quickSuggestions).toEqual(DETAILLANT_QUICK_SUGGESTIONS);
  });

  it("builds discrete retail intelligence without social wording", () => {
    const all = [
      ...buildRetailSignals(mockDetaillantHome()),
      ...buildRetailHints(mockDetaillantHome(), mockDetaillantNetwork()),
      ...buildRetailDemandSignals(mockDetaillantProducts(), mockDetaillantNetwork()),
    ]
      .map((h) => h.text)
      .join(" ");
    expect(all).not.toMatch(/like|emoji|story|chatbot|social/i);
    expect(all.length).toBeGreaterThan(0);
  });
});
