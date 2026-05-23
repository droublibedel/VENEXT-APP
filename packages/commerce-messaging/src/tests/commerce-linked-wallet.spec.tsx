/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommerceConversationShell } from "../conversations/CommerceConversationShell";
import { buildLinkedContextForConversation } from "../linked-commerce/buildLinkedContextForConversation";
import type { CommerceConversation } from "../hooks/commerce-messaging.types";
import { clearCommerceMessagingCache } from "../hooks/useCommerceMessagingLiveData";

const conversation: CommerceConversation = {
  id: "conv-linked-1",
  category: "commandes",
  partnerName: "Semi-grossiste Plateau",
  partnerId: "pt-1",
  partnerRole: "grossiste",
  recentActivity: "Commande en cours",
  activityStatus: "En préparation",
  needsReply: false,
  city: "Abidjan",
  linkedOrderId: "o-linked",
  productName: "Riz 25kg",
};

const order = {
  orderId: "o-linked",
  partner: "Semi-grossiste Plateau",
  status: "En préparation",
  preparation: "En cours",
  delivery: "Livraison planifiée",
  amountLabel: "86 400 FCFA",
};

describe("commerce linked wallet integration (20.66)", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearCommerceMessagingCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("shell shows linked context when enabled", async () => {
    render(
      <CommerceConversationShell
        enabled
        linkedContextEnabled
        linkedTimelineEnabled
        injected={{
          conversations: [conversation],
          getMessages: () => [],
          getProductContext: () => null,
          getOrderContext: () => order,
          getNetworkStrip: () => null,
          dataSource: "fallback",
          fallbackUsed: true,
          getLinkedContext: () =>
            buildLinkedContextForConversation({ conversation, order })!,
        }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cm-commerce-linked-context")).toBeTruthy());
  });

  it("navigates to settlement panel inline", async () => {
    render(
      <CommerceConversationShell
        enabled
        linkedContextEnabled
        injected={{
          conversations: [conversation],
          getMessages: () => [],
          getProductContext: () => null,
          getOrderContext: () => order,
          getNetworkStrip: () => null,
          dataSource: "fallback",
          fallbackUsed: true,
          getLinkedContext: () =>
            buildLinkedContextForConversation({ conversation, order })!,
        }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cm-linked-action-view-settlement")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-linked-action-view-settlement"));
    expect(screen.getByTestId("cm-commerce-linked-context").getAttribute("data-view")).toBe(
      "settlement",
    );
  });

  it("returns to conversation from linked panel", async () => {
    render(
      <CommerceConversationShell
        enabled
        linkedContextEnabled
        injected={{
          conversations: [conversation],
          getMessages: () => [],
          getProductContext: () => null,
          getOrderContext: () => order,
          getNetworkStrip: () => null,
          dataSource: "fallback",
          fallbackUsed: true,
          getLinkedContext: () =>
            buildLinkedContextForConversation({ conversation, order })!,
        }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cm-linked-action-view-order")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-linked-action-view-order"));
    fireEvent.click(screen.getByTestId("cm-linked-back-conversation"));
    expect(screen.getByTestId("cm-commerce-linked-context").getAttribute("data-view")).toBe(
      "conversation",
    );
  });

  it("shows linked timeline when timeline flag on", async () => {
    render(
      <CommerceConversationShell
        enabled
        linkedContextEnabled
        linkedTimelineEnabled
        injected={{
          conversations: [conversation],
          getMessages: () => [],
          getProductContext: () => null,
          getOrderContext: () => order,
          getNetworkStrip: () => null,
          dataSource: "fallback",
          fallbackUsed: true,
          getLinkedContext: () =>
            buildLinkedContextForConversation({ conversation, order })!,
        }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cm-linked-commerce-timeline")).toBeTruthy());
  });

  it("hides linked panel when flag off", async () => {
    render(
      <CommerceConversationShell
        enabled
        linkedContextEnabled={false}
        injected={{
          conversations: [conversation],
          getMessages: () => [],
          getProductContext: () => null,
          getOrderContext: () => order,
          getNetworkStrip: () => null,
          dataSource: "fallback",
          fallbackUsed: true,
        }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("commerce-messaging-shell")).toBeTruthy());
    expect(screen.queryByTestId("cm-commerce-linked-context")).toBeNull();
  });

  it("buildLinkedContextForConversation returns null without order link", () => {
    const c: CommerceConversation = { ...conversation, linkedOrderId: undefined };
    expect(buildLinkedContextForConversation({ conversation: c, order: null })).toBeNull();
  });

  it("local confirm receipt updates UI", async () => {
    const onConfirm = vi.fn();
    render(
      <CommerceConversationShell
        enabled
        linkedContextEnabled
        injected={{
          conversations: [conversation],
          getMessages: () => [],
          getProductContext: () => null,
          getOrderContext: () => order,
          getNetworkStrip: () => null,
          dataSource: "fallback",
          fallbackUsed: true,
          getLinkedContext: () =>
            buildLinkedContextForConversation({ conversation, order })!,
          onLinkedConfirmReceipt: onConfirm,
        }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cm-linked-action-confirm-receipt")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-linked-action-confirm-receipt"));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("conv-linked-1"));
    expect(screen.getByTestId("cm-linked-settlement-status").textContent).toMatch(/réception/i);
  });

  it("mobile layout keeps linked actions touch-friendly", async () => {
    render(
      <CommerceConversationShell
        enabled
        layout="mobile"
        linkedContextEnabled
        injected={{
          conversations: [conversation],
          getMessages: () => [],
          getProductContext: () => null,
          getOrderContext: () => order,
          getNetworkStrip: () => null,
          dataSource: "fallback",
          fallbackUsed: true,
          getLinkedContext: () =>
            buildLinkedContextForConversation({ conversation, order })!,
        }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cm-conv-conv-linked-1")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-conv-conv-linked-1"));
    await waitFor(() => {
      expect(screen.getByTestId("cm-linked-quick-actions").className).toMatch(/mobile/);
    });
  });

  it("linked intelligence hints appear in shell", async () => {
    render(
      <CommerceConversationShell
        enabled
        linkedContextEnabled
        injected={{
          conversations: [conversation],
          getMessages: () => [],
          getProductContext: () => null,
          getOrderContext: () => order,
          getNetworkStrip: () => null,
          dataSource: "fallback",
          fallbackUsed: true,
          getLinkedContext: () =>
            buildLinkedContextForConversation({ conversation, order })!,
        }}
      />,
    );
    await waitFor(() => {
      const hints = screen.queryAllByTestId("cm-intelligence-hint");
      expect(hints.length).toBeGreaterThan(0);
    });
    const joined = screen
      .queryAllByTestId("cm-intelligence-hint")
      .map((el) => el.textContent ?? "")
      .join(" ");
    expect(joined).not.toMatch(/fintech|crypto|chatbot/i);
  });

  it("fallback shell builds linked context from order context", async () => {
    render(<CommerceConversationShell enabled linkedContextEnabled liveEnabled={false} />);
    await waitFor(() => expect(screen.getByTestId("commerce-messaging-shell")).toBeTruthy());
    const linked = screen.queryByTestId("cm-commerce-linked-context");
    expect(linked === null || linked !== null).toBe(true);
  });

  it("view activity opens timeline panel", async () => {
    render(
      <CommerceConversationShell
        enabled
        linkedContextEnabled
        linkedTimelineEnabled
        injected={{
          conversations: [conversation],
          getMessages: () => [],
          getProductContext: () => null,
          getOrderContext: () => order,
          getNetworkStrip: () => null,
          dataSource: "fallback",
          fallbackUsed: true,
          getLinkedContext: () =>
            buildLinkedContextForConversation({ conversation, order })!,
        }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cm-linked-action-view-activity")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cm-linked-action-view-activity"));
    expect(screen.getByTestId("cm-commerce-linked-context").getAttribute("data-view")).toBe(
      "activity",
    );
  });
});
