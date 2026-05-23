/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { lazy, Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RelationalOrderOrchestrationShell } from "./RelationalOrderOrchestrationShell";
import {
  assertNoErpSupplyChainUi,
  getAvailableQuickActions,
  humanStatusLabel,
  isCommercialDeliveryFlowEnabled,
  isCommercialSettlementFlowEnabled,
  isFormalActor,
  isRelationalOrderOrchestrationEnabled,
  isTerrainActor,
  nextStatusForAction,
  sanitizeOrderUiText,
} from "./relational-order-governance";
import {
  buildCommercialProgressHints,
  buildDeliverySignals,
  buildOrderFlowSignals,
  buildSettlementProgressHints,
  sanitizeRelationalOrderText,
} from "./relational-order-intelligence";
import { buildOrderTimeline } from "./relational-order-timeline";
import { getMockScenario, mockRelationalOrderView } from "./relational-order.viewmodel";
import { useRelationalOrderOrchestration } from "./useRelationalOrderOrchestration";

const LazyShell = lazy(() =>
  import("./RelationalOrderOrchestrationShell").then((m) => ({
    default: m.RelationalOrderOrchestrationShell,
  })),
);

const FLAGS_ON = {
  relational_order_orchestration_enabled: true,
  commercial_delivery_flow_enabled: true,
  commercial_settlement_flow_enabled: true,
};

afterEach(() => cleanup());

describe("relational order orchestration governance (20.73)", () => {
  it("enables orchestration by default in dev flags", () => {
    expect(isRelationalOrderOrchestrationEnabled({})).toBe(true);
    expect(isRelationalOrderOrchestrationEnabled({ relational_order_orchestration_enabled: false })).toBe(
      false,
    );
  });

  it("gates delivery and settlement flows", () => {
    expect(isCommercialDeliveryFlowEnabled(FLAGS_ON)).toBe(true);
    expect(isCommercialSettlementFlowEnabled(FLAGS_ON)).toBe(true);
    expect(
      isCommercialDeliveryFlowEnabled({ ...FLAGS_ON, commercial_delivery_flow_enabled: false }),
    ).toBe(false);
  });

  it("uses human commercial status labels", () => {
    expect(humanStatusLabel("PREPARING")).toBe("En préparation");
    expect(humanStatusLabel("IN_TRANSIT")).not.toMatch(/erp/i);
  });

  it("sanitizes erp jargon", () => {
    expect(sanitizeOrderUiText("workflow ERP supply chain")).not.toMatch(/erp/i);
  });

  it("separates formal and terrain actors", () => {
    expect(isFormalActor("producteur")).toBe(true);
    expect(isTerrainActor("detaillant")).toBe(true);
  });

  it("resolves next status for validate action", () => {
    expect(nextStatusForAction("validate-order", "CREATED")).toBe("VALIDATED");
    expect(nextStatusForAction("mark-shipped", "PREPARING")).toBe("IN_TRANSIT");
  });

  it("blocks erp supply chain test ids", () => {
    expect(assertNoErpSupplyChainUi("roo-order-detail")).toBe(true);
    expect(assertNoErpSupplyChainUi("erp-supply-panel")).toBe(false);
  });
});

describe("relational order intelligence (20.73)", () => {
  it("builds order flow signals", () => {
    const order = getMockScenario("C")!;
    expect(buildOrderFlowSignals(order).length).toBeGreaterThan(0);
  });

  it("builds commercial progress hints", () => {
    expect(buildCommercialProgressHints("PREPARING").length).toBeGreaterThan(0);
  });

  it("builds settlement hints with optional path", () => {
    expect(buildSettlementProgressHints(null).some((h) => h.includes("optionnel"))).toBe(true);
  });

  it("builds delivery signals for incident", () => {
    const order = getMockScenario("D")!;
    expect(buildDeliverySignals(order).some((s) => s.includes("attente") || s.length > 0)).toBe(true);
  });

  it("sanitizes forbidden analytics jargon", () => {
    expect(sanitizeRelationalOrderText("scoring IA marketplace")).not.toMatch(/scoring/i);
  });
});

describe("mock scenarios A–E (20.73)", () => {
  it("scenario A detaillant cash", () => {
    const a = getMockScenario("A")!;
    expect(a.settlement?.method).toBe("cash");
    expect(a.status).toBe("SETTLEMENT_CONFIRMED");
  });

  it("scenario B mobile money pending", () => {
    const b = getMockScenario("B")!;
    expect(b.settlement?.method).toBe("mobile-money");
    expect(b.status).toBe("SETTLEMENT_PENDING");
  });

  it("scenario C producteur preparation", () => {
    const c = getMockScenario("C")!;
    expect(c.status).toBe("PREPARING");
    expect(c.links.mailThreadId).toBeTruthy();
  });

  it("scenario D delivery incident", () => {
    const d = getMockScenario("D")!;
    expect(d.incident?.kind).toBe("delivery-delay");
  });

  it("scenario E sponsored corridor", () => {
    const e = getMockScenario("E")!;
    expect(e.sponsoredCorridor).toBe(true);
  });
});

describe("order timeline (20.73)", () => {
  it("builds commercial timeline steps", () => {
    const order = getMockScenario("B")!;
    const steps = buildOrderTimeline(order, FLAGS_ON);
    expect(steps.some((s) => s.label === "Livraison")).toBe(true);
    expect(steps.some((s) => s.label === "Commande envoyée")).toBe(true);
  });

  it("omits delivery when flag off", () => {
    const order = getMockScenario("B")!;
    const steps = buildOrderTimeline(order, { commercial_delivery_flow_enabled: false });
    expect(steps.some((s) => s.id === "delivery")).toBe(false);
  });
});

describe("actor quick actions (20.73)", () => {
  it("producteur can validate created orders", () => {
    const order = { ...getMockScenario("C")!, status: "CREATED" as const };
    const actions = getAvailableQuickActions("producteur", order, FLAGS_ON);
    expect(actions).toContain("validate-order");
  });

  it("grossiste b can confirm delivery", () => {
    const order = { ...getMockScenario("B")!, status: "IN_TRANSIT" as const };
    const actions = getAvailableQuickActions("grossiste_b", order, FLAGS_ON);
    expect(actions).toContain("confirm-delivery");
  });

  it("detaillant can confirm reception", () => {
    const order = { ...getMockScenario("A")!, status: "DELIVERED" as const };
    const actions = getAvailableQuickActions("detaillant", order, FLAGS_ON);
    expect(actions).toContain("confirm-reception");
  });
});

describe("useRelationalOrderOrchestration hook (20.73)", () => {
  function HookProbe({ role }: { role: "detaillant" | "producteur" }) {
    const orch = useRelationalOrderOrchestration({ actorRole: role, flags: FLAGS_ON });
    return (
      <div>
        <span data-testid="order-count">{orch.orders.length}</span>
        <span data-testid="active-id">{orch.activeOrderId ?? ""}</span>
      </div>
    );
  }

  it("loads mock orders for detaillant", () => {
    render(<HookProbe role="detaillant" />);
    expect(Number(screen.getByTestId("order-count").textContent)).toBeGreaterThan(0);
  });

  it("loads mock orders for producteur", () => {
    render(<HookProbe role="producteur" />);
    expect(screen.getByTestId("active-id").textContent).toBeTruthy();
  });
});

describe("RelationalOrderOrchestrationShell UI (20.73)", () => {
  it("renders shell commerce-first without erp", async () => {
    render(
      <RelationalOrderOrchestrationShell actorRole="detaillant" enabled flags={FLAGS_ON} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("relational-order-orchestration-shell")).toBeTruthy(),
    );
    expect(
      screen.getByTestId("relational-order-orchestration-shell").getAttribute("data-no-erp-supply-chain"),
    ).toBe("true");
    expect(screen.queryByText(/ERP/i)).toBeNull();
  });

  it("shows disabled state when flag off", () => {
    render(
      <RelationalOrderOrchestrationShell
        actorRole="detaillant"
        flags={{ relational_order_orchestration_enabled: false }}
      />,
    );
    expect(screen.getByTestId("roo-orchestration-disabled")).toBeTruthy();
  });

  it("shows mobile summary for terrain actor", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="grossiste_b" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("roo-mobile-summary")).toBeTruthy());
  });

  it("hides mobile summary for formal actor", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="producteur" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("relational-order-orchestration-shell")).toBeTruthy());
    expect(screen.queryByTestId("roo-mobile-summary")).toBeNull();
  });

  it("renders lifecycle timeline", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="grossiste_a" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("roo-lifecycle-timeline")).toBeTruthy());
  });

  it("renders virtual order list", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="detaillant" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("roo-order-list-virtual")).toBeTruthy());
  });

  it("selects order on row click", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="detaillant" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("roo-order-detail")).toBeTruthy());
    const view = mockRelationalOrderView("detaillant");
    const second = view.orders[1];
    if (second) {
      fireEvent.click(screen.getByTestId(`roo-order-row-${second.id}`));
      await waitFor(() => expect(screen.getByTestId("roo-status-card")).toBeTruthy());
    }
  });

  it("shows incident panel for scenario D", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="grossiste_b" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("roo-order-list-virtual")).toBeTruthy());
    const incident = getMockScenario("D")!;
    fireEvent.click(screen.getByTestId(`roo-order-row-${incident.id}`));
    await waitFor(() => expect(screen.getByTestId("roo-incident-panel")).toBeTruthy());
  });

  it("shows settlement panel when linked", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="detaillant" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("roo-settlement-panel")).toBeTruthy());
  });

  it("fires quick action transition", async () => {
    const onTransition = vi.fn();
    const created = {
      ...getMockScenario("C")!,
      status: "CREATED" as const,
      id: "ord-test-validate",
    };
    render(
      <RelationalOrderOrchestrationShell
        actorRole="producteur"
        enabled
        flags={FLAGS_ON}
        injected={{ view: { orders: [created], activeOrderId: created.id } }}
        onStatusTransition={onTransition}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("roo-action-validate-order")).toBeTruthy());
    fireEvent.click(screen.getByTestId("roo-action-validate-order"));
    expect(onTransition).toHaveBeenCalledWith(created.id, "VALIDATED");
  });

  it("opens conversation link callback", async () => {
    const onConv = vi.fn();
    render(
      <RelationalOrderOrchestrationShell
        actorRole="detaillant"
        enabled
        flags={FLAGS_ON}
        onOpenConversation={onConv}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("roo-action-open-conversation")).toBeTruthy());
    fireEvent.click(screen.getByTestId("roo-action-open-conversation"));
    expect(onConv).toHaveBeenCalled();
  });

  it("opens wallet callback", async () => {
    const onWallet = vi.fn();
    const order = getMockScenario("B")!;
    render(
      <RelationalOrderOrchestrationShell
        actorRole="grossiste_b"
        enabled
        flags={FLAGS_ON}
        injected={{ view: { orders: [order], activeOrderId: order.id } }}
        onOpenWallet={onWallet}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("roo-action-view-settlement")).toBeTruthy());
    fireEvent.click(screen.getByTestId("roo-action-view-settlement"));
    expect(onWallet).toHaveBeenCalledWith("tx-mm-01");
  });

  it("lazy loads shell component", async () => {
    render(
      <Suspense fallback={<span data-testid="roo-lazy-fallback">…</span>}>
        <LazyShell actorRole="detaillant" enabled flags={FLAGS_ON} />
      </Suspense>,
    );
    expect(screen.getByTestId("roo-lazy-fallback")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByTestId("relational-order-orchestration-shell")).toBeTruthy(),
    );
  });

  it("shows activity panel for sponsored order", async () => {
    const order = getMockScenario("E")!;
    render(
      <RelationalOrderOrchestrationShell
        actorRole="grossiste_a"
        enabled
        flags={FLAGS_ON}
        injected={{ view: { orders: [order], activeOrderId: order.id } }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("roo-activity-panel")).toBeTruthy());
  });

  it("shows partner card", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="detaillant" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("roo-partner-card")).toBeTruthy());
  });

  it("shows flow signals", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="producteur" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("roo-flow-signals")).toBeTruthy());
  });

  it("shows preparation panel for producteur order", async () => {
    const order = getMockScenario("C")!;
    render(
      <RelationalOrderOrchestrationShell
        actorRole="producteur"
        enabled
        flags={FLAGS_ON}
        injected={{ view: { orders: [order], activeOrderId: order.id } }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("roo-preparation-panel")).toBeTruthy());
  });

  it("shows shipment panel when in transit without sponsor", async () => {
    const order = { ...getMockScenario("B")!, status: "IN_TRANSIT" as const, sponsoredCorridor: false };
    render(
      <RelationalOrderOrchestrationShell
        actorRole="grossiste_a"
        enabled
        flags={FLAGS_ON}
        injected={{ view: { orders: [order], activeOrderId: order.id } }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("roo-shipment-panel")).toBeTruthy());
  });

  it("shows reception panel after delivery", async () => {
    const order = { ...getMockScenario("A")!, status: "DELIVERED" as const };
    render(
      <RelationalOrderOrchestrationShell
        actorRole="detaillant"
        enabled
        flags={FLAGS_ON}
        injected={{ view: { orders: [order], activeOrderId: order.id } }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("roo-reception-panel")).toBeTruthy());
  });

  it("exposes commerce-first data attribute on shell", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="detaillant" enabled flags={FLAGS_ON} />);
    await waitFor(() =>
      expect(
        screen.getByTestId("relational-order-orchestration-shell").getAttribute("data-commerce-first"),
      ).toBe("true"),
    );
  });

  it("anti-jargon: no supply chain wording in UI", async () => {
    render(<RelationalOrderOrchestrationShell actorRole="grossiste_a" enabled flags={FLAGS_ON} />);
    await waitFor(() => expect(screen.getByTestId("relational-order-orchestration-shell")).toBeTruthy());
    expect(document.body.textContent).not.toMatch(/supply chain/i);
    expect(document.body.textContent).not.toMatch(/ticket/i);
  });
});
