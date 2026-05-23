"use client";

import { lazy, memo, Suspense, useCallback, useEffect, useMemo } from "react";

import { bindOrderOrchestrationContextRouting } from "./commercial-context-bridge";
import { isRelationalOrderOrchestrationEnabled } from "./relational-order-governance";
import { RelationalOrderActivityPanel } from "./RelationalOrderActivityPanel";
import { RelationalOrderDeliveryPanel } from "./RelationalOrderDeliveryPanel";
import { RelationalOrderEmptyState } from "./RelationalOrderEmptyState";
import { RelationalOrderIncidentPanel } from "./RelationalOrderIncidentPanel";
import { RelationalOrderLifecycleTimeline } from "./RelationalOrderLifecycleTimeline";
import { RelationalOrderListVirtual } from "./RelationalOrderListVirtual";
import { RelationalOrderMobileSummary } from "./RelationalOrderMobileSummary";
import { RelationalOrderPartnerCard } from "./RelationalOrderPartnerCard";
import { RelationalOrderPreparationPanel } from "./RelationalOrderPreparationPanel";
import { RelationalOrderQuickActions } from "./RelationalOrderQuickActions";
import { RelationalOrderReceptionPanel } from "./RelationalOrderReceptionPanel";
import { RelationalOrderSettlementPanel } from "./RelationalOrderSettlementPanel";
import { RelationalOrderShipmentPanel } from "./RelationalOrderShipmentPanel";
import { RelationalOrderStatusCard } from "./RelationalOrderStatusCard";
import type {
  RelationalOrderOrchestrationShellProps,
  RelationalOrderQuickActionId,
} from "./relational-order-orchestration.types";
import { useRelationalOrderOrchestration } from "./useRelationalOrderOrchestration";

const LazyTimeline = lazy(() =>
  import("./RelationalOrderLifecycleTimeline").then((m) => ({
    default: m.RelationalOrderLifecycleTimeline,
  })),
);

function ActivePanel({
  panel,
  order,
  onOpenWallet,
  onOpenActivity,
}: {
  panel: string;
  order: NonNullable<ReturnType<typeof useRelationalOrderOrchestration>["activeOrder"]>;
  onOpenWallet?: (id: string) => void;
  onOpenActivity?: (id: string) => void;
}) {
  switch (panel) {
    case "preparation":
      return <RelationalOrderPreparationPanel order={order} />;
    case "shipment":
      return <RelationalOrderShipmentPanel order={order} />;
    case "delivery":
      return <RelationalOrderDeliveryPanel order={order} />;
    case "reception":
      return <RelationalOrderReceptionPanel order={order} />;
    case "settlement":
      return <RelationalOrderSettlementPanel order={order} onOpenWallet={onOpenWallet} />;
    case "incident":
      return <RelationalOrderIncidentPanel order={order} />;
    case "activity":
      return <RelationalOrderActivityPanel order={order} onOpenActivity={onOpenActivity} />;
    default:
      return null;
  }
}

function RelationalOrderOrchestrationShellInner({
  actorRole,
  enabled = true,
  flags = {},
  injected,
  onQuickAction,
  onStatusTransition,
  onSelectOrder,
  onOpenConversation,
  onOpenMail,
  onOpenWallet,
  onOpenActivity,
  contextRouting,
  focusOrderId,
}: RelationalOrderOrchestrationShellProps) {
  const routed = useMemo(
    () =>
      bindOrderOrchestrationContextRouting(
        {
          onQuickAction,
          onOpenConversation,
          onOpenMail,
          onOpenWallet,
          onOpenActivity,
        },
        contextRouting,
      ),
    [
      contextRouting,
      onQuickAction,
      onOpenConversation,
      onOpenMail,
      onOpenWallet,
      onOpenActivity,
    ],
  );

  const orch = useRelationalOrderOrchestration({
    actorRole,
    injected,
    enabled,
    flags,
    onStatusTransition,
  });

  useEffect(() => {
    if (focusOrderId) orch.selectOrder(focusOrderId);
  }, [focusOrderId, orch]);

  const handleQuickAction = useCallback(
    (actionId: RelationalOrderQuickActionId) => {
      if (!orch.activeOrder) return;
      const orderId = orch.activeOrder.id;

      if (actionId === "open-conversation" && orch.activeOrder.links.conversationId) {
        routed.onOpenConversation?.(orch.activeOrder.links.conversationId);
      } else if (actionId === "open-mail" && orch.activeOrder.links.mailThreadId) {
        routed.onOpenMail?.(orch.activeOrder.links.mailThreadId);
      } else if (actionId === "view-settlement" && orch.activeOrder.links.walletTransactionId) {
        routed.onOpenWallet?.(orch.activeOrder.links.walletTransactionId);
      } else if (actionId === "view-activity" && orch.activeOrder.links.activityId) {
        routed.onOpenActivity?.(orch.activeOrder.links.activityId);
      } else {
        orch.applyQuickAction(actionId);
      }
      routed.onQuickAction?.(actionId, orderId);
    },
    [orch, routed],
  );

  const handleSelect = useCallback(
    (id: string) => {
      orch.selectOrder(id);
      onSelectOrder?.(id);
    },
    [orch, onSelectOrder],
  );

  const title = useMemo(
    () => (orch.isTerrain ? "Mes commandes" : "Commandes réseau"),
    [orch.isTerrain],
  );

  if (!enabled || !isRelationalOrderOrchestrationEnabled(flags)) {
    return (
      <section data-testid="roo-orchestration-disabled" className="roo-shell">
        <p className="roo-hint">Orchestration commandes — non activée.</p>
      </section>
    );
  }

  if (orch.loading) {
    return (
      <section data-testid="roo-orchestration-loading" className="roo-shell">
        <p className="roo-hint">Chargement des commandes…</p>
      </section>
    );
  }

  if (orch.orders.length === 0) {
    return (
      <section data-testid="relational-order-orchestration-shell" className="roo-shell">
        <RelationalOrderEmptyState />
      </section>
    );
  }

  const order = orch.activeOrder;

  return (
    <section
      data-testid="relational-order-orchestration-shell"
      className={`roo-shell${orch.isTerrain ? " roo-shell--terrain" : " roo-shell--formal"}`}
      data-actor={actorRole}
      data-commerce-first="true"
      data-no-erp-supply-chain="true"
    >
      <header className="roo-header">
        <h2 className="roo-title">{title}</h2>
        <p className="roo-subtitle">Votre commande avance dans votre activité commerciale.</p>
        {orch.fallbackUsed ? (
          <span data-testid="roo-data-fallback" className="roo-hint">
            Données de démonstration
          </span>
        ) : null}
      </header>

      {orch.isTerrain && order ? <RelationalOrderMobileSummary order={order} /> : null}

      <RelationalOrderListVirtual
        orders={orch.orders}
        activeOrderId={orch.activeOrderId}
        onSelect={handleSelect}
        terrainMode={orch.isTerrain}
      />

      {order ? (
        <div className="roo-detail" data-testid="roo-order-detail">
          <RelationalOrderPartnerCard partner={order.partner} />
          <RelationalOrderStatusCard order={order} />

          <Suspense fallback={<p className="roo-hint">Timeline…</p>}>
            <LazyTimeline steps={orch.timeline} />
          </Suspense>

          <RelationalOrderQuickActions
            order={order}
            actorRole={actorRole}
            flags={flags}
            onAction={handleQuickAction}
          />

          <ActivePanel
            panel={orch.activePanel}
            order={order}
            onOpenWallet={onOpenWallet}
            onOpenActivity={onOpenActivity}
          />
        </div>
      ) : (
        <RelationalOrderEmptyState message="Sélectionnez une commande." />
      )}
    </section>
  );
}

export const RelationalOrderOrchestrationShell = memo(RelationalOrderOrchestrationShellInner);
