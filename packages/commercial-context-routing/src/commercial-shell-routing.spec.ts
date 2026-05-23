import { describe, expect, it, vi } from "vitest";

import {
  createDetaillantCommercialRouter,
  createGrossisteACommercialRouter,
  createGrossisteBCommercialRouter,
  createProducerCommercialRouter,
} from "./index";
import { isCommercialContextRoutingEnabled } from "./commercial-context-routing";

const FLAGS_ON = {
  commercial_context_routing_enabled: true,
  commercial_context_history_enabled: true,
  commercial_cross_module_navigation_enabled: true,
  commercial_relationship_governance_enabled: false,
};

describe("commercial shell routing — actor routers (20.76-A)", () => {
  it("grossiste B router switches tab on order navigation", () => {
    const setActiveTab = vi.fn();
    const router = createGrossisteBCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveTab },
    });
    router.navigate("order-to-delivery", { orderId: "o-1", deliveryId: "d-1" });
    expect(setActiveTab).toHaveBeenCalledWith("activity");
  });

  it("grossiste B mail intent routes to messaging (terrain)", () => {
    const setActiveTab = vi.fn();
    const router = createGrossisteBCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveTab },
    });
    router.navigate("order-to-mail", { orderId: "o-1", mailThreadId: "m-1" });
    expect(setActiveTab).toHaveBeenCalledWith("messaging");
  });

  it("grossiste A router switches workspace on settlement", () => {
    const setActiveWorkspace = vi.fn();
    const router = createGrossisteACommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveWorkspace },
    });
    router.navigate("order-to-wallet", { orderId: "o-1", settlementId: "s-1" });
    expect(setActiveWorkspace).toHaveBeenCalledWith("commerce-wallet");
  });

  it("grossiste A formal mail routes to network workspace", () => {
    const setActiveWorkspace = vi.fn();
    const router = createGrossisteACommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveWorkspace },
    });
    router.navigate("order-to-mail", { orderId: "o-1", mailThreadId: "mail-1" });
    expect(setActiveWorkspace).toHaveBeenCalledWith("network");
  });

  it("detaillant router opens orders tab for delivery intent", () => {
    const setActiveTab = vi.fn();
    const router = createDetaillantCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveTab },
    });
    router.navigate("order-to-delivery", { orderId: "o-1", deliveryId: "d-1" });
    expect(setActiveTab).toHaveBeenCalledWith("orders");
  });

  it("detaillant catalog-to-order opens orders tab", () => {
    const setActiveTab = vi.fn();
    const router = createDetaillantCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveTab },
    });
    router.navigate("catalog-to-order", { supplierId: "sup-1", catalogId: "cat-1" });
    expect(setActiveTab).toHaveBeenCalledWith("orders");
  });

  it("producer router selects relational pole for order", () => {
    const setActivePole = vi.fn();
    const setRelationalTab = vi.fn();
    const router = createProducerCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActivePole, setRelationalTab },
    });
    router.navigate("messaging-to-order", { orderId: "o-1" });
    expect(setActivePole).toHaveBeenCalledWith("relational-commercial");
    expect(setRelationalTab).toHaveBeenCalledWith("orders");
  });

  it("producer mail intent opens mail workspace pole", () => {
    const setActivePole = vi.fn();
    const router = createProducerCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActivePole },
    });
    router.navigate("order-to-mail", { orderId: "o-1", mailThreadId: "mail-1" });
    expect(setActivePole).toHaveBeenCalledWith("producer-commercial-mail-workspace");
  });

  it("routing disabled when flag off — no tab change", () => {
    const setActiveTab = vi.fn();
    const router = createGrossisteBCommercialRouter({
      flags: { commercial_context_routing_enabled: false },
      navigation: { setActiveTab },
    });
    const result = router.navigate("order-to-messaging", { orderId: "o-1" });
    expect(result).toBeNull();
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it("single router instance preserves active settlement context", () => {
    const router = createGrossisteBCommercialRouter({
      flags: FLAGS_ON,
      navigation: { setActiveTab: vi.fn() },
    });
    router.navigate("order-to-wallet", { orderId: "o-1", settlementId: "s-1" });
    expect(router.store.active.activeModule).toBe("wallet");
    expect(router.store.active.settlementId).toBe("s-1");
  });
});

describe("commercial shell routing — flags (20.76-A)", () => {
  it("isCommercialContextRoutingEnabled defaults true", () => {
    expect(isCommercialContextRoutingEnabled({})).toBe(true);
  });
});
