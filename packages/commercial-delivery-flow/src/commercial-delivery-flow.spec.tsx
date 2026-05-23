/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { lazy, Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommercialDeliveryFlowShell } from "./CommercialDeliveryFlowShell";
import {
  assertNoLogisticsErpUi,
  getAvailableDeliveryQuickActions,
  humanDeliveryStatusLabel,
  isCommercialDeliveryActivityEnabled,
  isCommercialDeliveryFlowEnabled,
  isCommercialReceptionConfirmationEnabled,
  isFormalActor,
  isTerrainActor,
  nextStatusForDeliveryAction,
} from "./commercial-delivery-governance";
import {
  buildCommercialCorridorHints,
  buildDeliveryFlowSignals,
  buildDeliveryProgressHints,
  buildReceptionSignals,
  sanitizeCommercialDeliveryText,
} from "./commercial-delivery-intelligence";
import { buildDeliveryTimeline } from "./commercial-delivery-timeline";
import { getMockDeliveryScenario, mockCommercialDeliveryView } from "./commercial-delivery.viewmodel";
import { useCommercialDeliveryFlow } from "./useCommercialDeliveryFlow";

const LazyShell = lazy(() =>
  import("./CommercialDeliveryFlowShell").then((m) => ({ default: m.CommercialDeliveryFlowShell })),
);

const FLAGS = {
  commercial_delivery_flow_enabled: true,
  commercial_reception_confirmation_enabled: true,
  commercial_delivery_activity_enabled: true,
};

afterEach(() => cleanup());

describe("commercial delivery governance (20.74)", () => {
  it("enables delivery flow by default", () => {
    expect(isCommercialDeliveryFlowEnabled({})).toBe(true);
    expect(isCommercialDeliveryFlowEnabled({ commercial_delivery_flow_enabled: false })).toBe(false);
  });

  it("gates reception and activity flags", () => {
    expect(isCommercialReceptionConfirmationEnabled(FLAGS)).toBe(true);
    expect(isCommercialDeliveryActivityEnabled(FLAGS)).toBe(true);
  });

  it("uses human labels not tms jargon", () => {
    expect(humanDeliveryStatusLabel("ON_THE_WAY")).toBe("Livraison en route");
    expect(humanDeliveryStatusLabel("ON_THE_WAY")).not.toMatch(/tms/i);
  });

  it("separates actors", () => {
    expect(isTerrainActor("detaillant")).toBe(true);
    expect(isFormalActor("producteur")).toBe(true);
  });

  it("transitions confirm departure", () => {
    expect(nextStatusForDeliveryAction("confirm-departure", "READY_FOR_DISPATCH")).toBe("ON_THE_WAY");
  });

  it("blocks logistics erp test ids", () => {
    expect(assertNoLogisticsErpUi("cdf-delivery-detail")).toBe(true);
    expect(assertNoLogisticsErpUi("tms-panel")).toBe(false);
  });
});

describe("commercial delivery intelligence (20.74)", () => {
  it("builds flow signals", () => {
    expect(buildDeliveryFlowSignals(getMockDeliveryScenario("E")!).length).toBeGreaterThan(0);
  });

  it("builds progress hints", () => {
    expect(buildDeliveryProgressHints("PREPARING_LOADING").length).toBeGreaterThan(0);
  });

  it("builds reception signals", () => {
    expect(buildReceptionSignals(getMockDeliveryScenario("B")!).length).toBeGreaterThan(0);
  });

  it("builds corridor hints", () => {
    const c = getMockDeliveryScenario("C")!;
    expect(buildCommercialCorridorHints(c.route).some((h) => h.includes("Bouaké"))).toBe(true);
  });

  it("sanitizes supply chain jargon", () => {
    expect(sanitizeCommercialDeliveryText("TMS WMS GPS flotte")).not.toMatch(/tms/i);
  });
});

describe("mock scenarios A–E (20.74)", () => {
  it("A detaillant arriving cash pending", () => {
    const a = getMockDeliveryScenario("A")!;
    expect(a.status).toBe("ARRIVING");
    expect(a.settlement?.statusLabel).toMatch(/attente/i);
  });

  it("B mobile money reception confirmed", () => {
    const b = getMockDeliveryScenario("B")!;
    expect(b.status).toBe("RECEPTION_CONFIRMED");
    expect(b.settlement?.method).toBe("mobile-money");
  });

  it("C producteur corridor", () => {
    const c = getMockDeliveryScenario("C")!;
    expect(c.route.corridorLabel).toContain("Abidjan");
  });

  it("D delayed incident", () => {
    expect(getMockDeliveryScenario("D")?.incident?.kind).toBe("delay");
  });

  it("E sponsor corridor", () => {
    expect(getMockDeliveryScenario("E")?.sponsoredCorridor).toBe(true);
  });
});

describe("delivery timeline (20.74)", () => {
  it("builds terrain timeline", () => {
    const steps = buildDeliveryTimeline(getMockDeliveryScenario("A")!, FLAGS);
    expect(steps.some((s) => s.label === "Livraison en route")).toBe(true);
  });
});

describe("quick actions (20.74)", () => {
  it("grossiste b can confirm delivery in transit", () => {
    const d = { ...getMockDeliveryScenario("E")!, status: "ON_THE_WAY" as const };
    expect(getAvailableDeliveryQuickActions("grossiste_b", d, FLAGS)).toContain("confirm-delivery");
  });

  it("detaillant can confirm reception when delivered", () => {
    const d = { ...getMockDeliveryScenario("A")!, status: "DELIVERED" as const };
    expect(getAvailableDeliveryQuickActions("detaillant", d, FLAGS)).toContain("confirm-reception");
  });
});

describe("useCommercialDeliveryFlow (20.74)", () => {
  function Probe({ role }: { role: "grossiste_b" | "detaillant" }) {
    const f = useCommercialDeliveryFlow({ actorRole: role, flags: FLAGS });
    return <span data-testid="count">{f.deliveries.length}</span>;
  }

  it("loads deliveries for grossiste b", () => {
    render(<Probe role="grossiste_b" />);
    expect(Number(screen.getByTestId("count").textContent)).toBeGreaterThan(0);
  });
});

describe("CommercialDeliveryFlowShell UI (20.74)", () => {
  it("renders commerce-first shell", async () => {
    render(<CommercialDeliveryFlowShell actorRole="detaillant" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("commercial-delivery-flow-shell")).toBeTruthy());
    expect(screen.getByTestId("commercial-delivery-flow-shell").getAttribute("data-no-logistics-erp")).toBe(
      "true",
    );
  });

  it("disabled when flag off", () => {
    render(
      <CommercialDeliveryFlowShell
        actorRole="detaillant"
        flags={{ commercial_delivery_flow_enabled: false }}
      />,
    );
    expect(screen.getByTestId("cdf-flow-disabled")).toBeTruthy();
  });

  it("mobile card for terrain", async () => {
    render(<CommercialDeliveryFlowShell actorRole="grossiste_b" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("cdf-mobile-card")).toBeTruthy());
  });

  it("no mobile card for formal", async () => {
    render(<CommercialDeliveryFlowShell actorRole="producteur" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("commercial-delivery-flow-shell")).toBeTruthy());
    expect(screen.queryByTestId("cdf-mobile-card")).toBeNull();
  });

  it("renders timeline", async () => {
    render(<CommercialDeliveryFlowShell actorRole="detaillant" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("cdf-delivery-timeline")).toBeTruthy());
  });

  it("virtual list", async () => {
    render(<CommercialDeliveryFlowShell actorRole="grossiste_a" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("cdf-delivery-list-virtual")).toBeTruthy());
  });

  it("route card", async () => {
    render(<CommercialDeliveryFlowShell actorRole="producteur" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("cdf-route-card")).toBeTruthy());
  });

  it("activity feed sponsor", async () => {
    const d = getMockDeliveryScenario("E")!;
    render(
      <CommercialDeliveryFlowShell
        actorRole="grossiste_a"
        enabled
        flags={FLAGS}
        injected={{ view: { deliveries: [d], activeDeliveryId: d.id } }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-activity-feed")).toBeTruthy());
    expect(screen.getByTestId("cdf-activity-corridor")).toBeTruthy();
  });

  it("incident panel scenario D", async () => {
    const d = getMockDeliveryScenario("D")!;
    render(
      <CommercialDeliveryFlowShell
        actorRole="grossiste_b"
        enabled
        flags={FLAGS}
        injected={{ view: { deliveries: [d], activeDeliveryId: d.id } }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-incident-panel")).toBeTruthy());
  });

  it("reception panel when delivered detaillant", async () => {
    const d = { ...getMockDeliveryScenario("A")!, status: "DELIVERED" as const };
    render(
      <CommercialDeliveryFlowShell
        actorRole="detaillant"
        enabled
        flags={FLAGS}
        injected={{ view: { deliveries: [d], activeDeliveryId: d.id } }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-reception-panel")).toBeTruthy());
  });

  it("confirmation panel producteur", async () => {
    const d = getMockDeliveryScenario("C")!;
    render(
      <CommercialDeliveryFlowShell
        actorRole="producteur"
        enabled
        flags={FLAGS}
        injected={{ view: { deliveries: [d], activeDeliveryId: d.id } }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-confirmation-panel")).toBeTruthy());
  });

  it("transition confirm departure", async () => {
    const onTransition = vi.fn();
    const d = { ...getMockDeliveryScenario("C")!, status: "READY_FOR_DISPATCH" as const };
    render(
      <CommercialDeliveryFlowShell
        actorRole="grossiste_b"
        enabled
        flags={FLAGS}
        injected={{ view: { deliveries: [d], activeDeliveryId: d.id } }}
        onStatusTransition={onTransition}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-action-confirm-departure")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cdf-action-confirm-departure"));
    expect(onTransition).toHaveBeenCalledWith(d.id, "ON_THE_WAY");
  });

  it("open conversation callback", async () => {
    const onConv = vi.fn();
    render(
      <CommercialDeliveryFlowShell actorRole="detaillant" enabled flags={FLAGS} onOpenConversation={onConv} />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-action-open-conversation")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cdf-action-open-conversation"));
    expect(onConv).toHaveBeenCalled();
  });

  it("view settlement wallet", async () => {
    const onWallet = vi.fn();
    const d = getMockDeliveryScenario("B")!;
    render(
      <CommercialDeliveryFlowShell
        actorRole="detaillant"
        enabled
        flags={FLAGS}
        injected={{ view: { deliveries: [d], activeDeliveryId: d.id } }}
        onOpenWallet={onWallet}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-action-view-settlement")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cdf-action-view-settlement"));
    expect(onWallet).toHaveBeenCalledWith("tx-mm-02");
  });

  it("view linked order", async () => {
    const onOrder = vi.fn();
    render(
      <CommercialDeliveryFlowShell actorRole="detaillant" enabled flags={FLAGS} onOpenOrder={onOrder} />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-action-view-linked-order")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cdf-action-view-linked-order"));
    expect(onOrder).toHaveBeenCalled();
  });

  it("lazy loads shell", async () => {
    render(
      <Suspense fallback={<span data-testid="cdf-lazy">…</span>}>
        <LazyShell actorRole="grossiste_b" enabled flags={FLAGS} />
      </Suspense>,
    );
    expect(screen.getByTestId("cdf-lazy")).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("commercial-delivery-flow-shell")).toBeTruthy());
  });

  it("flow signals visible", async () => {
    render(<CommercialDeliveryFlowShell actorRole="grossiste_b" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("cdf-flow-signals")).toBeTruthy());
  });

  it("anti-jargon no supply chain in body", async () => {
    render(<CommercialDeliveryFlowShell actorRole="grossiste_a" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("commercial-delivery-flow-shell")).toBeTruthy());
    expect(document.body.textContent).not.toMatch(/supply chain/i);
    expect(document.body.textContent).not.toMatch(/uber freight/i);
  });

  it("mark arriving action", async () => {
    const d = { ...getMockDeliveryScenario("E")!, status: "ON_THE_WAY" as const };
    render(
      <CommercialDeliveryFlowShell
        actorRole="grossiste_b"
        enabled
        flags={FLAGS}
        injected={{ view: { deliveries: [d], activeDeliveryId: d.id } }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-action-mark-arriving")).toBeTruthy());
  });

  it("open mail for producteur", async () => {
    const onMail = vi.fn();
    const d = getMockDeliveryScenario("C")!;
    render(
      <CommercialDeliveryFlowShell
        actorRole="producteur"
        enabled
        flags={FLAGS}
        injected={{ view: { deliveries: [d], activeDeliveryId: d.id } }}
        onOpenMail={onMail}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-action-open-mail")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cdf-action-open-mail"));
    expect(onMail).toHaveBeenCalledWith("mail-c");
  });

  it("view terrain activity", async () => {
    const onAct = vi.fn();
    const d = getMockDeliveryScenario("E")!;
    render(
      <CommercialDeliveryFlowShell
        actorRole="grossiste_a"
        enabled
        flags={FLAGS}
        injected={{ view: { deliveries: [d], activeDeliveryId: d.id } }}
        onOpenActivity={onAct}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("cdf-action-view-terrain-activity")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cdf-action-view-terrain-activity"));
    expect(onAct).toHaveBeenCalledWith("act-corridor");
  });

  it("select delivery row", async () => {
    render(<CommercialDeliveryFlowShell actorRole="detaillant" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("cdf-delivery-detail")).toBeTruthy());
    const view = mockCommercialDeliveryView("detaillant");
    const second = view.deliveries[1];
    if (second) {
      fireEvent.click(screen.getByTestId(`cdf-delivery-row-${second.id}`));
      await waitFor(() => expect(screen.getByTestId("cdf-status-card")).toBeTruthy());
    }
  });

  it("hook loads detaillant deliveries", () => {
    const view = mockCommercialDeliveryView("detaillant");
    expect(view.deliveries.length).toBeGreaterThan(0);
  });

  it("partner card visible", async () => {
    render(<CommercialDeliveryFlowShell actorRole="detaillant" enabled flags={FLAGS} />);
    await waitFor(() => expect(screen.getByTestId("cdf-partner-card")).toBeTruthy());
  });

  it("commerce-first attribute", async () => {
    render(<CommercialDeliveryFlowShell actorRole="detaillant" enabled flags={FLAGS} />);
    await waitFor(() =>
      expect(screen.getByTestId("commercial-delivery-flow-shell").getAttribute("data-commerce-first")).toBe(
        "true",
      ),
    );
  });
});
