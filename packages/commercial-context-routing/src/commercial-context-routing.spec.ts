import { describe, expect, it } from "vitest";

import {
  assertSingleActiveContext,
  createCommercialContextStore,
  isCommercialContextHistoryEnabled,
  isCommercialContextRoutingEnabled,
  isCrossModuleNavigationEnabled,
  pickPrimaryContextKey,
  setActiveCommercialContext,
} from "./commercial-context-routing";
import {
  resolveCommercialContext,
  resolvePanelForModule,
  sanitizeCommercialNavigationLabel,
} from "./commercial-context-resolution";

const FLAGS_ON = {
  commercial_context_routing_enabled: true,
  commercial_context_history_enabled: true,
  commercial_cross_module_navigation_enabled: true,
};

describe("commercial context routing core (20.76)", () => {
  it("routing enabled by default in dev flags shape", () => {
    expect(isCommercialContextRoutingEnabled({})).toBe(true);
    expect(isCommercialContextHistoryEnabled(FLAGS_ON)).toBe(true);
    expect(isCrossModuleNavigationEnabled(FLAGS_ON)).toBe(true);
  });

  it("routing disabled when flag off", () => {
    expect(
      isCommercialContextRoutingEnabled({ commercial_context_routing_enabled: false }),
    ).toBe(false);
  });

  it("single active context store", () => {
    const store = createCommercialContextStore({ orderId: "o-1" });
    expect(assertSingleActiveContext(store)).toBe(true);
    setActiveCommercialContext(store, { orderId: "o-2", activeModule: "order" });
    expect(store.active.orderId).toBe("o-2");
  });

  it("pickPrimaryContextKey prioritizes order", () => {
    expect(
      pickPrimaryContextKey({ orderId: "o-1", conversationId: "c-1" }),
    ).toBe("orderId");
  });

  it("resolveCommercialContext merges link graph by order", () => {
    const store = createCommercialContextStore();
    const resolved = resolveCommercialContext(
      { orderId: "ord-a" },
      {
        store,
        linkGraph: {
          byOrderId: {
            "ord-a": { conversationId: "conv-a", deliveryId: "del-a" },
          },
        },
      },
    );
    expect(resolved.reference.conversationId).toBe("conv-a");
    expect(resolved.reference.deliveryId).toBe("del-a");
    expect(resolved.primaryModule).toBe("order");
  });

  it("resolve panel hints per module", () => {
    expect(resolvePanelForModule("order")).toBe("status");
    expect(resolvePanelForModule("wallet")).toBe("transactions");
  });

  it("sanitize blocks ERP navigation labels", () => {
    expect(sanitizeCommercialNavigationLabel("ERP wizard dashboard")).not.toMatch(/erp/i);
  });

  it("anti enterprise — resolution panel hint commerce-first", () => {
    const resolved = resolveCommercialContext({ orderId: "o-1" });
    expect(resolved.panelHint).toMatch(/commande|commercial/i);
  });
});
