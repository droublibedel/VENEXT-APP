/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";

import {
  FIXED_PRICE_COMPOSER_SUGGESTIONS,
  isPartnerAuthorized,
  resolveConversationGovernance,
} from "./commerce-conversation-governance";
import type { CommerceMessagingAccountSettings } from "./commerce-conversation-governance.types";
import {
  mockCommerceAccountSettings,
  mockOrderConversationGovernance,
  mockProductConversationSettings,
} from "../mocks/commerce-messaging-mock-data";
import {
  buildConversationModeHints,
  buildNegotiationSignals,
} from "../intelligence/commerce-messaging-intelligence";
import { mockProductContext } from "../mocks/commerce-messaging-mock-data";

const baseAccount = (): CommerceMessagingAccountSettings => ({
  messagingEnabled: true,
  defaultMode: "NEGOTIABLE",
  partnersOnly: false,
  authorizedPartnerIds: ["pt-grossiste"],
});

describe("commerce conversation governance", () => {
  it("disables composer when messaging is off", () => {
    const r = resolveConversationGovernance({
      account: { ...baseAccount(), messagingEnabled: false },
    });
    expect(r.mode).toBe("DISABLED");
    expect(r.composerVisible).toBe(false);
    expect(r.badgeLabel).toBe("Discussion désactivée");
  });

  it("applies fixed price mode on product", () => {
    const r = resolveConversationGovernance({
      account: baseAccount(),
      product: mockProductConversationSettings("pr-fixed"),
    });
    expect(r.mode).toBe("FIXED_PRICE_ONLY");
    expect(r.composerSuggestions).toEqual(FIXED_PRICE_COMPOSER_SUGGESTIONS);
    expect(r.badgeLabel).toBe("Prix fixe");
  });

  it("keeps negotiable mode for open trading product", () => {
    const r = resolveConversationGovernance({
      account: baseAccount(),
      product: mockProductConversationSettings("pr1"),
    });
    expect(r.mode).toBe("NEGOTIABLE");
    expect(r.composerVisible).toBe(true);
  });

  it("disables discussion when product conversation is off", () => {
    const r = resolveConversationGovernance({
      account: baseAccount(),
      product: mockProductConversationSettings("pr-industrial"),
    });
    expect(r.mode).toBe("DISABLED");
    expect(r.composerVisible).toBe(false);
  });

  it("restricts partner-only conversations", () => {
    const r = resolveConversationGovernance({
      account: { ...baseAccount(), partnersOnly: true, authorizedPartnerIds: ["pt-grossiste"] },
      product: mockProductConversationSettings("pr-partner"),
      partnerId: "pt-unknown",
      partnerAuthorized: false,
    });
    expect(r.mode).toBe("PARTNER_ONLY");
    expect(r.composerVisible).toBe(false);
  });

  it("allows authorized partners in partner-only mode", () => {
    expect(isPartnerAuthorized(mockCommerceAccountSettings(), "pt-detail")).toBe(true);
    const r = resolveConversationGovernance({
      account: { ...baseAccount(), partnersOnly: true, authorizedPartnerIds: ["pt-grossiste"] },
      partnerId: "pt-grossiste",
    });
    expect(r.partnerAuthorized).toBe(true);
    expect(r.composerVisible).toBe(true);
  });

  it("hides composer for readonly order scope", () => {
    const r = resolveConversationGovernance({
      account: baseAccount(),
      order: mockOrderConversationGovernance("o-readonly"),
    });
    expect(r.mode).toBe("ORDER_CONTEXT_ONLY");
    expect(r.composerVisible).toBe(false);
    expect(r.orderNotice).toMatch(/lecture seule/i);
  });

  it("limits delivery-only orders to delivery suggestions", () => {
    const r = resolveConversationGovernance({
      account: baseAccount(),
      order: mockOrderConversationGovernance("o3"),
    });
    expect(r.mode).toBe("ORDER_CONTEXT_ONLY");
    expect(r.composerSuggestions.some((s) => /livraison/i.test(s))).toBe(true);
  });

  it("builds conversation mode hints for fixed price", () => {
    const hints = buildConversationModeHints("FIXED_PRICE_ONLY");
    expect(hints[0]?.text).toMatch(/prix fixe/i);
  });

  it("builds negotiation signals for negotiable product", () => {
    const hints = buildNegotiationSignals("NEGOTIABLE", mockProductContext("pr1"));
    expect(hints.length).toBeGreaterThan(0);
  });

  it("mock industrial product is disabled", () => {
    const s = mockProductConversationSettings("pr-industrial");
    expect(s.conversationEnabled).toBe(false);
    expect(s.conversationMode).toBe("DISABLED");
  });

  it("mock account enables negotiation by default", () => {
    const a = mockCommerceAccountSettings();
    expect(a.messagingEnabled).toBe(true);
    expect(a.defaultMode).toBe("NEGOTIABLE");
  });
});
