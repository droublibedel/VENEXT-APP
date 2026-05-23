"use client";

import { lazy, memo, Suspense, useCallback, useMemo } from "react";

import { CommercialDeliveryActivityFeed } from "./CommercialDeliveryActivityFeed";
import { CommercialDeliveryConfirmationPanel } from "./CommercialDeliveryConfirmationPanel";
import { CommercialDeliveryEmptyState } from "./CommercialDeliveryEmptyState";
import { CommercialDeliveryIncidentPanel } from "./CommercialDeliveryIncidentPanel";
import { CommercialDeliveryListVirtual } from "./CommercialDeliveryListVirtual";
import { CommercialDeliveryMobileCard } from "./CommercialDeliveryMobileCard";
import { CommercialDeliveryPartnerCard } from "./CommercialDeliveryPartnerCard";
import { CommercialDeliveryQuickActions } from "./CommercialDeliveryQuickActions";
import { CommercialDeliveryReceptionPanel } from "./CommercialDeliveryReceptionPanel";
import { CommercialDeliveryRouteCard } from "./CommercialDeliveryRouteCard";
import { CommercialDeliveryStatusCard } from "./CommercialDeliveryStatusCard";
import { bindDeliveryContextRouting } from "./commercial-context-bridge";
import { isCommercialDeliveryFlowEnabled } from "./commercial-delivery-governance";
import type {
  CommercialDeliveryFlowShellProps,
  CommercialDeliveryQuickActionId,
} from "./commercial-delivery-flow.types";
import { useCommercialDeliveryFlow } from "./useCommercialDeliveryFlow";

const LazyTimeline = lazy(() =>
  import("./CommercialDeliveryTimeline").then((m) => ({ default: m.CommercialDeliveryTimeline })),
);

function ActiveDeliveryPanel({
  panel,
  delivery,
  onOpenOrder,
  onOpenActivity,
}: {
  panel: string;
  delivery: NonNullable<ReturnType<typeof useCommercialDeliveryFlow>["activeDelivery"]>;
  onOpenOrder?: (id: string) => void;
  onOpenActivity?: (id: string) => void;
}) {
  switch (panel) {
    case "confirmation":
      return <CommercialDeliveryConfirmationPanel delivery={delivery} />;
    case "reception":
      return <CommercialDeliveryReceptionPanel delivery={delivery} />;
    case "incident":
      return <CommercialDeliveryIncidentPanel delivery={delivery} />;
    case "activity":
      return (
        <CommercialDeliveryActivityFeed
          delivery={delivery}
          onOpenOrder={onOpenOrder}
          onOpenActivity={onOpenActivity}
        />
      );
    default:
      return null;
  }
}

function CommercialDeliveryFlowShellInner({
  actorRole,
  enabled = true,
  flags = {},
  injected,
  onQuickAction,
  onStatusTransition,
  onSelectDelivery,
  onOpenConversation,
  onOpenMail,
  onOpenWallet,
  onOpenOrder,
  onOpenActivity,
  contextRouting,
}: CommercialDeliveryFlowShellProps) {
  const routed = useMemo(
    () =>
      bindDeliveryContextRouting(
        {
          onQuickAction,
          onOpenConversation,
          onOpenMail,
          onOpenWallet,
          onOpenOrder,
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
      onOpenOrder,
      onOpenActivity,
    ],
  );

  const flow = useCommercialDeliveryFlow({
    actorRole,
    injected,
    enabled,
    flags,
    onStatusTransition,
  });

  const handleAction = useCallback(
    (actionId: CommercialDeliveryQuickActionId) => {
      if (!flow.activeDelivery) return;
      const id = flow.activeDelivery.id;
      const d = flow.activeDelivery;

      if (actionId === "open-conversation" && d.links.conversationId) {
        routed.onOpenConversation?.(d.links.conversationId);
      } else if (actionId === "open-mail" && d.links.mailThreadId) {
        routed.onOpenMail?.(d.links.mailThreadId);
      } else if (actionId === "view-settlement" && d.links.walletTransactionId) {
        routed.onOpenWallet?.(d.links.walletTransactionId);
      } else if (actionId === "view-linked-order" && d.links.orderId) {
        routed.onOpenOrder?.(d.links.orderId);
      } else if (actionId === "view-terrain-activity" && d.links.activityId) {
        routed.onOpenActivity?.(d.links.activityId);
      } else {
        flow.applyQuickAction(actionId);
      }
      routed.onQuickAction?.(actionId, id);
    },
    [flow, routed],
  );

  const handleSelect = useCallback(
    (deliveryId: string) => {
      flow.selectDelivery(deliveryId);
      onSelectDelivery?.(deliveryId);
    },
    [flow, onSelectDelivery],
  );

  const title = useMemo(
    () => (flow.isTerrain ? "Mes livraisons" : "Activité livraison réseau"),
    [flow.isTerrain],
  );

  if (!enabled || !isCommercialDeliveryFlowEnabled(flags)) {
    return (
      <section data-testid="cdf-flow-disabled" className="cdf-shell">
        <p className="cdf-hint">Livraison relationnelle — non activée.</p>
      </section>
    );
  }

  if (flow.loading) {
    return (
      <section data-testid="cdf-flow-loading" className="cdf-shell">
        <p className="cdf-hint">Chargement…</p>
      </section>
    );
  }

  if (flow.deliveries.length === 0) {
    return (
      <section data-testid="commercial-delivery-flow-shell" className="cdf-shell">
        <CommercialDeliveryEmptyState />
      </section>
    );
  }

  const delivery = flow.activeDelivery;

  return (
    <section
      data-testid="commercial-delivery-flow-shell"
      className={`cdf-shell${flow.isTerrain ? " cdf-shell--terrain" : " cdf-shell--formal"}`}
      data-actor={actorRole}
      data-commerce-first="true"
      data-no-logistics-erp="true"
    >
      <header className="cdf-header">
        <h2 className="cdf-title">{title}</h2>
        <p className="cdf-subtitle">Ma livraison avance avec mon activité commerciale.</p>
        {flow.fallbackUsed ? (
          <span data-testid="cdf-data-fallback" className="cdf-hint">
            Données de démonstration
          </span>
        ) : null}
      </header>

      {flow.isTerrain && delivery ? <CommercialDeliveryMobileCard delivery={delivery} /> : null}

      <CommercialDeliveryListVirtual
        deliveries={flow.deliveries}
        activeId={flow.activeDeliveryId}
        onSelect={handleSelect}
        compact={flow.isTerrain}
      />

      {delivery ? (
        <div className="cdf-detail" data-testid="cdf-delivery-detail">
          <CommercialDeliveryPartnerCard partner={delivery.partner} />
          <CommercialDeliveryRouteCard route={delivery.route} />
          <CommercialDeliveryStatusCard delivery={delivery} />

          <Suspense fallback={<p className="cdf-hint">Timeline…</p>}>
            <LazyTimeline steps={flow.timeline} />
          </Suspense>

          <CommercialDeliveryQuickActions
            delivery={delivery}
            actorRole={actorRole}
            flags={flags}
            onAction={handleAction}
          />

          <ActiveDeliveryPanel
            panel={flow.activePanel}
            delivery={delivery}
            onOpenOrder={onOpenOrder}
            onOpenActivity={onOpenActivity}
          />
        </div>
      ) : (
        <CommercialDeliveryEmptyState message="Sélectionnez une livraison." />
      )}
    </section>
  );
}

export const CommercialDeliveryFlowShell = memo(CommercialDeliveryFlowShellInner);
