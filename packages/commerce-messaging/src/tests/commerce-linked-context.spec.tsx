/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CommerceConversationCommerceContext } from "../linked-commerce/CommerceConversationCommerceContext";
import { CommerceConversationQuickActions } from "../linked-commerce/CommerceConversationQuickActions";
import { CommerceLinkedCommerceTimeline } from "../linked-commerce/CommerceLinkedCommerceTimeline";
import { CommerceLinkedOrderCard } from "../linked-commerce/CommerceLinkedOrderCard";
import { CommerceLinkedTransactionCard } from "../linked-commerce/CommerceLinkedTransactionCard";
import {
  buildCommerceLinkedContext,
  buildCommerceLinkedTimeline,
  inferSettlementFromOrder,
} from "../linked-commerce/buildCommerceLinkedContext";
import {
  buildCommercialFlowHints,
  buildLinkedCommerceSignals,
  buildSettlementConversationHints,
  sanitizeCommerceText,
} from "../intelligence/commerce-messaging-intelligence";

const sampleOrder = {
  orderId: "o-100",
  partner: "Partenaire Test",
  status: "En préparation",
  preparation: "En cours",
  delivery: "Planifiée",
  amountLabel: "42 000 FCFA",
};

describe("commerce linked context (20.66)", () => {
  afterEach(() => cleanup());

  it("buildCommerceLinkedContext links conversation to order", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "Grossiste Nord",
      city: "Bouaké",
      order: sampleOrder,
      settlement: inferSettlementFromOrder(sampleOrder),
    });
    expect(ctx.order?.orderId).toBe("o-100");
    expect(ctx.settlement).toBeTruthy();
    expect(ctx.timeline.length).toBe(7);
  });

  it("buildCommerceLinkedContext enriches relationship when roles provided (20.75)", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c-rel",
      partnerName: "Grossiste B",
      city: "Abidjan",
      actorRole: "grossiste_b",
      partnerRole: "detaillant",
      relationshipFlags: {
        commercial_relationship_governance_enabled: true,
        commercial_relationship_context_enabled: true,
      },
    });
    expect(ctx.relationship?.relationshipLabel).toBeTruthy();
    expect(ctx.relationship?.preferMessaging).toBe(true);
  });

  it("buildCommerceLinkedTimeline shows commercial steps not banking", () => {
    const steps = buildCommerceLinkedTimeline({
      productName: "Riz 25kg",
      order: sampleOrder,
    });
    expect(steps.map((s) => s.label)).toContain("Commande créée");
    expect(steps.map((s) => s.label).join(" ")).not.toMatch(/virement bancaire|scoring/i);
  });

  it("renders linked order card", () => {
    render(<CommerceLinkedOrderCard order={sampleOrder} />);
    expect(screen.getByTestId("cm-linked-order-card").textContent).toMatch(/42 000/);
  });

  it("renders linked transaction card", () => {
    const settlement = inferSettlementFromOrder(sampleOrder)!;
    render(<CommerceLinkedTransactionCard settlement={settlement} partnerName="Test" />);
    expect(screen.getByTestId("cm-linked-transaction-card")).toBeTruthy();
  });

  it("renders commerce timeline", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "P",
      city: "Abidjan",
      order: sampleOrder,
    });
    render(<CommerceLinkedCommerceTimeline steps={ctx.timeline} />);
    expect(screen.getByTestId("cm-linked-commerce-timeline")).toBeTruthy();
    expect(screen.getByTestId("cm-linked-timeline-order-created")).toBeTruthy();
  });

  it("quick actions include view order and view settlement", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "P",
      city: "Abidjan",
      order: sampleOrder,
      settlement: inferSettlementFromOrder(sampleOrder),
    });
    const clicks: string[] = [];
    render(
      <CommerceConversationQuickActions
        context={ctx}
        activeView="conversation"
        onAction={(a) => clicks.push(a)}
      />,
    );
    fireEvent.click(screen.getByTestId("cm-linked-action-view-order"));
    fireEvent.click(screen.getByTestId("cm-linked-action-view-settlement"));
    expect(clicks).toContain("view-order");
    expect(clicks).toContain("view-settlement");
  });

  it("back to conversation action when on settlement view", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "P",
      city: "Abidjan",
      order: sampleOrder,
      settlement: inferSettlementFromOrder(sampleOrder),
    });
    const clicks: string[] = [];
    render(
      <CommerceConversationQuickActions
        context={ctx}
        activeView="settlement"
        onAction={(a) => clicks.push(a)}
      />,
    );
    fireEvent.click(screen.getByTestId("cm-linked-action-back-conversation"));
    expect(clicks).toContain("back-conversation");
  });

  it("commerce context panel switches to order view", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "P",
      city: "Abidjan",
      order: sampleOrder,
      settlement: inferSettlementFromOrder(sampleOrder),
    });
    const { rerender } = render(
      <CommerceConversationCommerceContext
        context={ctx}
        activeView="conversation"
        onViewChange={() => {}}
        timelineEnabled
      />,
    );
    rerender(
      <CommerceConversationCommerceContext
        context={ctx}
        activeView="order"
        onViewChange={() => {}}
        timelineEnabled
      />,
    );
    expect(screen.getByTestId("cm-commerce-linked-context").getAttribute("data-view")).toBe(
      "order",
    );
  });

  it("buildLinkedCommerceSignals stays calm", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "P",
      city: "Abidjan",
      order: sampleOrder,
      settlement: { ...inferSettlementFromOrder(sampleOrder)!, partnerConfirmed: true },
    });
    const hints = buildLinkedCommerceSignals(ctx);
    expect(hints.map((h) => h.text).join(" ")).toMatch(/commande|règlement/i);
    expect(hints.map((h) => h.text).join(" ")).not.toMatch(/chatbot|scoring/i);
  });

  it("buildSettlementConversationHints mentions delivery", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "P",
      city: "Abidjan",
      order: sampleOrder,
      settlement: inferSettlementFromOrder(sampleOrder),
    });
    const hints = buildSettlementConversationHints(ctx);
    expect(hints.some((h) => h.text.toLowerCase().includes("livraison"))).toBe(true);
  });

  it("buildCommercialFlowHints for active flow", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "P",
      city: "Abidjan",
      productName: "Huile",
    });
    expect(buildCommercialFlowHints(ctx)[0]?.text).toMatch(/active/i);
  });

  it("sanitizeCommerceText blocks jargon", () => {
    expect(sanitizeCommerceText("governance observatory chatbot")).not.toMatch(
      /governance|chatbot/i,
    );
  });

  it("confirm receipt action available in conversation view", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "P",
      city: "Abidjan",
      order: sampleOrder,
      settlement: inferSettlementFromOrder(sampleOrder),
    });
    render(
      <CommerceConversationQuickActions
        context={ctx}
        activeView="conversation"
        onAction={() => {}}
      />,
    );
    expect(screen.getByTestId("cm-linked-action-confirm-receipt")).toBeTruthy();
  });

  it("mobile variant uses touch chips", () => {
    const ctx = buildCommerceLinkedContext({
      conversationId: "c1",
      partnerName: "P",
      city: "Abidjan",
      order: sampleOrder,
    });
    render(
      <CommerceConversationQuickActions
        context={ctx}
        activeView="conversation"
        onAction={() => {}}
        variant="mobile"
      />,
    );
    expect(screen.getByTestId("cm-linked-quick-actions").className).toMatch(/mobile/);
  });
});
