import { describe, expect, it, vi } from "vitest";

import { createCommercialContextRouter, mergeWithContextRouter } from "./commercial-context-router";
import {
  navigateCommercialContext,
  assertNavigationNotEnterprise,
  getTransitionTargetModule,
} from "./commercial-context-navigation";
import { createCommercialContextStore } from "./commercial-context-routing";

const FLAGS_ON = {
  commercial_context_routing_enabled: true,
  commercial_context_history_enabled: true,
  commercial_cross_module_navigation_enabled: true,
};

const GRAPH = {
  byOrderId: {
    "ord-a": {
      conversationId: "conv-a",
      mailThreadId: "mail-a",
      deliveryId: "del-a",
      settlementId: "stl-a",
      activityId: "act-a",
    },
  },
  byConversationId: {
    "conv-a": { orderId: "ord-a" },
  },
};

describe("commercial cross-module navigation (20.76)", () => {
  it("catalog → order", () => {
    const store = createCommercialContextStore();
    const intent = navigateCommercialContext(
      "catalog-to-order",
      { supplierId: "sup-1", productId: "p-1" },
      { store, flags: FLAGS_ON },
    );
    expect(intent?.target).toBe("order");
    expect(intent?.inline).toBe(true);
    expect(store.active.orderId).toBeTruthy();
  });

  it("order → delivery", () => {
    const store = createCommercialContextStore({ orderId: "ord-a" });
    const intent = navigateCommercialContext(
      "order-to-delivery",
      { orderId: "ord-a" },
      { store, flags: FLAGS_ON, linkGraph: GRAPH },
    );
    expect(intent?.target).toBe("delivery");
    expect(store.active.deliveryId).toBe("del-a");
  });

  it("order → wallet", () => {
    const store = createCommercialContextStore({ orderId: "ord-a" });
    const intent = navigateCommercialContext(
      "order-to-wallet",
      { orderId: "ord-a" },
      { store, flags: FLAGS_ON, linkGraph: GRAPH },
    );
    expect(intent?.target).toBe("wallet");
    expect(store.active.settlementId).toBeTruthy();
  });

  it("order → messaging", () => {
    const store = createCommercialContextStore({ orderId: "ord-a" });
    const intent = navigateCommercialContext(
      "order-to-messaging",
      { orderId: "ord-a" },
      { store, flags: FLAGS_ON, linkGraph: GRAPH },
    );
    expect(intent?.target).toBe("messaging");
    expect(store.active.conversationId).toBe("conv-a");
  });

  it("order → mail", () => {
    const store = createCommercialContextStore({ orderId: "ord-a" });
    const intent = navigateCommercialContext(
      "order-to-mail",
      { orderId: "ord-a" },
      { store, flags: FLAGS_ON, linkGraph: GRAPH },
    );
    expect(intent?.target).toBe("mail");
    expect(store.active.mailThreadId).toBe("mail-a");
  });

  it("conversation → order", () => {
    const store = createCommercialContextStore({ conversationId: "conv-a" });
    const intent = navigateCommercialContext(
      "messaging-to-order",
      { conversationId: "conv-a" },
      { store, flags: FLAGS_ON, linkGraph: GRAPH },
    );
    expect(intent?.target).toBe("order");
    expect(store.active.orderId).toBe("ord-a");
  });

  it("wallet → order", () => {
    const store = createCommercialContextStore({ settlementId: "stl-a", orderId: "ord-a" });
    const intent = navigateCommercialContext(
      "wallet-to-order",
      { settlementId: "stl-a", orderId: "ord-a" },
      { store, flags: FLAGS_ON },
    );
    expect(intent?.target).toBe("order");
  });

  it("delivery → order linked", () => {
    const store = createCommercialContextStore({ deliveryId: "del-a", orderId: "ord-a" });
    const intent = navigateCommercialContext(
      "delivery-to-order",
      { deliveryId: "del-a", orderId: "ord-a" },
      { store, flags: FLAGS_ON },
    );
    expect(intent?.target).toBe("order");
  });

  it("delivery → reception inline", () => {
    const intent = navigateCommercialContext(
      "delivery-to-reception",
      { deliveryId: "del-a" },
      { store: createCommercialContextStore(), flags: FLAGS_ON },
    );
    expect(intent?.inline).toBe(true);
    expect(intent?.target).toBe("delivery");
  });

  it("wallet → activity", () => {
    const intent = navigateCommercialContext(
      "wallet-to-activity",
      { settlementId: "stl-a" },
      { store: createCommercialContextStore(), flags: FLAGS_ON },
    );
    expect(intent?.target).toBe("activity");
  });

  it("router fires onNavigate callback", () => {
    const onNavigate = vi.fn();
    const router = createCommercialContextRouter({ flags: FLAGS_ON, linkGraph: GRAPH, onNavigate });
    router.navigate("order-to-messaging", { orderId: "ord-a" });
    expect(onNavigate).toHaveBeenCalled();
  });

  it("order shell handlers bridge conversation", () => {
    const onNavigate = vi.fn();
    const router = createCommercialContextRouter({ flags: FLAGS_ON, onNavigate });
    router.orderShellHandlers().onOpenConversation?.("conv-x");
    expect(onNavigate).toHaveBeenCalled();
  });

  it("catalog shell handlers bridge quick order", () => {
    const onNavigate = vi.fn();
    const router = createCommercialContextRouter({ flags: FLAGS_ON, onNavigate });
    router.catalogShellHandlers().onQuickOrder?.("sup-1", "prod-1");
    expect(onNavigate).toHaveBeenCalled();
  });

  it("messaging handlers bridge view order", () => {
    const onNavigate = vi.fn();
    const router = createCommercialContextRouter({ flags: FLAGS_ON, onNavigate });
    router.messagingHandlers().onViewOrder?.("ord-1");
    expect(onNavigate).toHaveBeenCalled();
  });

  it("mergeWithContextRouter chains user callback", () => {
    const userFn = vi.fn();
    const router = createCommercialContextRouter({ flags: FLAGS_ON });
    const merged = mergeWithContextRouter(
      { onOpenConversation: userFn },
      router,
      "orderShellHandlers",
    );
    merged.onOpenConversation?.("conv-1");
    expect(userFn).toHaveBeenCalledWith("conv-1");
  });

  it("navigation blocked when cross-module flag off", () => {
    const intent = navigateCommercialContext(
      "order-to-delivery",
      { orderId: "o-1" },
      {
        store: createCommercialContextStore(),
        flags: { ...FLAGS_ON, commercial_cross_module_navigation_enabled: false },
      },
    );
    expect(intent).toBeNull();
  });

  it("anti ERP navigation intent", () => {
    const intent = navigateCommercialContext(
      "order-to-mail",
      { orderId: "o-1", mailThreadId: "m-1" },
      { store: createCommercialContextStore(), flags: FLAGS_ON },
    );
    expect(intent && assertNavigationNotEnterprise(intent)).toBe(true);
  });

  it("lightweight inline transitions", () => {
    const intent = navigateCommercialContext(
      "catalog-to-order",
      { supplierId: "s" },
      { store: createCommercialContextStore(), flags: FLAGS_ON },
    );
    expect(intent?.inline).toBe(true);
    expect(intent?.label).not.toMatch(/wizard|tunnel/i);
  });

  it("mobile continuity — compact target messaging", () => {
    const router = createCommercialContextRouter({ flags: FLAGS_ON, linkGraph: GRAPH });
    const intent = router.navigate("order-to-messaging", { orderId: "ord-a" });
    expect(intent?.target).toBe("messaging");
  });

  it("formal continuity — mail target", () => {
    const intent = navigateCommercialContext(
      "order-to-mail",
      { orderId: "ord-a" },
      { store: createCommercialContextStore(), flags: FLAGS_ON, linkGraph: GRAPH },
    );
    expect(intent?.target).toBe("mail");
  });

  it("order → activity", () => {
    const intent = navigateCommercialContext(
      "order-to-activity",
      { orderId: "ord-a", activityId: "act-a" },
      { store: createCommercialContextStore(), flags: FLAGS_ON, linkGraph: GRAPH },
    );
    expect(intent?.target).toBe("activity");
  });

  it("mail → order via router", () => {
    const router = createCommercialContextRouter({ flags: FLAGS_ON, linkGraph: GRAPH });
    router.navigate("mail-to-order", { mailThreadId: "mail-a", orderId: "ord-a" });
    expect(router.store.active.orderId).toBe("ord-a");
  });

  it("single active primary context after navigation", () => {
    const router = createCommercialContextRouter({ flags: FLAGS_ON });
    router.navigate("catalog-to-order", { supplierId: "s-1" });
    expect(router.store.active.activeModule).toBe("order");
  });

  it("order shell exposes at most five routed handlers", () => {
    const router = createCommercialContextRouter({ flags: FLAGS_ON });
    expect(Object.keys(router.orderShellHandlers()).length).toBeLessThanOrEqual(5);
  });

  it("anti social — labels stay commerce scoped", () => {
    const intent = navigateCommercialContext(
      "order-to-messaging",
      { conversationId: "c-1" },
      { store: createCommercialContextStore(), flags: FLAGS_ON },
    );
    expect(intent?.label).not.toMatch(/followers|feed public/i);
  });

  it("anti fintech — wallet transition label", () => {
    const intent = navigateCommercialContext(
      "order-to-wallet",
      { orderId: "o-1" },
      { store: createCommercialContextStore(), flags: FLAGS_ON },
    );
    expect(intent?.label).not.toMatch(/trading|neobank/i);
  });

  it("getTransitionTargetModule for delivery reception", () => {
    expect(getTransitionTargetModule("delivery-to-reception")).toBe("delivery");
  });
});
