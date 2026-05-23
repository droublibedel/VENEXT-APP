import { describe, expect, it } from "vitest";

import { createCommercialContextRouter } from "./commercial-context-router";
import {
  buildCommercialContextHistory,
  pushCommercialContextHistory,
  restorePreviousCommercialContext,
  trimCommercialContextHistory,
} from "./commercial-context-history";
import { createCommercialContextStore } from "./commercial-context-routing";

const FLAGS_ON = {
  commercial_context_routing_enabled: true,
  commercial_context_history_enabled: true,
  commercial_cross_module_navigation_enabled: true,
};

describe("commercial context history (20.76)", () => {
  it("builds empty history when disabled", () => {
    const store = createCommercialContextStore();
    const snap = buildCommercialContextHistory(store, {
      commercial_context_history_enabled: false,
    });
    expect(snap.entries).toHaveLength(0);
  });

  it("records last partner order conversation settlement delivery", () => {
    const store = createCommercialContextStore();
    pushCommercialContextHistory(
      store,
      { module: "order", reference: { orderId: "o-1", partnerId: "p-1" }, label: "Commande" },
      FLAGS_ON,
    );
    pushCommercialContextHistory(
      store,
      { module: "messaging", reference: { conversationId: "c-1" }, label: "Discussion" },
      FLAGS_ON,
    );
    pushCommercialContextHistory(
      store,
      { module: "wallet", reference: { settlementId: "s-1" }, label: "Règlement" },
      FLAGS_ON,
    );
    pushCommercialContextHistory(
      store,
      { module: "delivery", reference: { deliveryId: "d-1" }, label: "Livraison" },
      FLAGS_ON,
    );

    const snap = buildCommercialContextHistory(store, FLAGS_ON);
    expect(snap.lastOrderId).toBe("o-1");
    expect(snap.lastConversationId).toBe("c-1");
    expect(snap.lastSettlementId).toBe("s-1");
    expect(snap.lastDeliveryId).toBe("d-1");
  });

  it("caps history at five entries", () => {
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

  it("restore previous context", () => {
    const store = createCommercialContextStore({ orderId: "o-current" });
    pushCommercialContextHistory(
      store,
      { module: "order", reference: { orderId: "o-prev" }, label: "Précédent" },
      FLAGS_ON,
    );
    pushCommercialContextHistory(
      store,
      { module: "messaging", reference: { conversationId: "c-1" }, label: "Fil" },
      FLAGS_ON,
    );
    const restored = restorePreviousCommercialContext(store, FLAGS_ON);
    expect(restored?.orderId).toBe("o-prev");
  });

  it("router goBack returns prior reference", () => {
    const router = createCommercialContextRouter({ flags: FLAGS_ON });
    router.navigate("catalog-to-order", { supplierId: "s-1" });
    router.navigate("order-to-messaging", { conversationId: "c-1" });
    const back = router.goBack();
    expect(back).toBeTruthy();
  });

  it("history is UX-only not audit trail", () => {
    const store = createCommercialContextStore();
    pushCommercialContextHistory(
      store,
      { module: "order", reference: { orderId: "o-1" }, label: "Commande terrain" },
      FLAGS_ON,
    );
    const snap = buildCommercialContextHistory(store, FLAGS_ON);
    expect(JSON.stringify(snap)).not.toMatch(/audit|regulatory|compliance log/i);
  });

  it("no enterprise graph in history entries", () => {
    const store = createCommercialContextStore();
    pushCommercialContextHistory(
      store,
      { module: "network", reference: { partnerId: "p-1" }, label: "Partenaire réseau" },
      FLAGS_ON,
    );
    expect(store.history[0]?.label).not.toMatch(/supply chain/i);
  });

  it("trimCommercialContextHistory caps entries (20.85)", () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      at: i,
      module: "order" as const,
      reference: { orderId: `o-${i}` },
      label: `Commande ${i}`,
    }));
    expect(trimCommercialContextHistory(rows, 5)).toHaveLength(5);
  });
});
