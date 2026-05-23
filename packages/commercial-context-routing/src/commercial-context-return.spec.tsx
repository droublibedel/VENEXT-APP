import { describe, expect, it, vi } from "vitest";

import {
  applyDetaillantBackNavigation,
  applyGrossisteABackNavigation,
  applyGrossisteBBackNavigation,
  applyProducerBackNavigation,
  createGrossisteBCommercialRouter,
  grossisteBTabFromReference,
  grossisteAWorkspaceFromReference,
  detaillantTabFromReference,
  producerPoleFromReference,
  producerSubTabFromReference,
} from "./index";
import { pushCommercialContextHistory } from "./commercial-context-history";
import { createCommercialContextStore } from "./commercial-context-routing";

const FLAGS_ON = {
  commercial_context_routing_enabled: true,
  commercial_context_history_enabled: true,
  commercial_cross_module_navigation_enabled: true,
};

describe("commercial context return — history (20.76-A)", () => {
  it("goBack restores previous reference", () => {
    const setActiveTab = vi.fn();
    const router = createGrossisteBCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveTab },
    });
    router.navigate("catalog-to-order", { supplierId: "s-1", orderId: "o-1" });
    router.navigate("order-to-delivery", { orderId: "o-1", deliveryId: "d-1" });
    const prev = router.goBack();
    expect(prev?.orderId).toBe("o-1");
    expect(router.store.history.length).toBeGreaterThanOrEqual(1);
  });

  it("applyGrossisteBBackNavigation maps order to orders tab", () => {
    const setActiveTab = vi.fn();
    applyGrossisteBBackNavigation({ orderId: "o-1", activeModule: "order" }, setActiveTab);
    expect(setActiveTab).toHaveBeenCalledWith("orders");
  });

  it("applyGrossisteABackNavigation maps mail to network", () => {
    const setWorkspace = vi.fn();
    applyGrossisteABackNavigation({ mailThreadId: "m-1", activeModule: "mail" }, setWorkspace);
    expect(setWorkspace).toHaveBeenCalledWith("network");
  });

  it("applyDetaillantBackNavigation maps wallet to account", () => {
    const setTab = vi.fn();
    applyDetaillantBackNavigation({ settlementId: "s-1", activeModule: "wallet" }, setTab);
    expect(setTab).toHaveBeenCalledWith("account");
  });

  it("applyProducerBackNavigation maps order pole and sub-tab", () => {
    const setPole = vi.fn();
    const setSubTab = vi.fn();
    applyProducerBackNavigation({ orderId: "o-1", activeModule: "order" }, setPole, setSubTab);
    expect(setPole).toHaveBeenCalledWith("relational-commercial");
    expect(setSubTab).toHaveBeenCalledWith("orders");
  });

  it("history depth capped at five entries", () => {
    const store = createCommercialContextStore();
    for (let i = 0; i < 8; i++) {
      pushCommercialContextHistory(
        store,
        { module: "order", reference: { orderId: `o-${i}` }, label: `Step ${i}` },
        FLAGS_ON,
      );
    }
    expect(store.history.length).toBeLessThanOrEqual(5);
  });

  it("grossisteBTabFromReference resolves conversation", () => {
    expect(grossisteBTabFromReference({ conversationId: "c-1" })).toBe("messaging");
  });

  it("grossisteAWorkspaceFromReference resolves distribution", () => {
    expect(grossisteAWorkspaceFromReference({ deliveryId: "d-1" })).toBe("distribution");
  });

  it("detaillantTabFromReference resolves products catalog", () => {
    expect(detaillantTabFromReference({ catalogId: "cat-1" })).toBe("products");
  });

  it("producerPoleFromReference resolves fulfillment", () => {
    expect(producerPoleFromReference({ deliveryId: "d-1" })).toBe("order-fulfillment");
  });

  it("producerSubTabFromReference resolves activity", () => {
    expect(producerSubTabFromReference({ activityId: "a-1" })).toBe("activity");
  });

  it("quick return chain: order → delivery → back to order context", () => {
    const setActiveTab = vi.fn();
    const router = createGrossisteBCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveTab },
    });
    router.navigate("catalog-to-order", { orderId: "o-99", supplierId: "sup-1" });
    router.navigate("order-to-delivery", { orderId: "o-99", deliveryId: "d-99" });
    const prev = router.goBack();
    applyGrossisteBBackNavigation(prev, setActiveTab);
    expect(setActiveTab).toHaveBeenLastCalledWith("orders");
  });

  it("goBack returns null when history shallow", () => {
    const router = createGrossisteBCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveTab: vi.fn() },
    });
    expect(router.goBack()).toBeNull();
  });
});
