"use client";

import { memo } from "react";

import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

function RelationalOrderActivityPanelInner({
  order,
  onOpenActivity,
}: {
  order: RelationalCommercialOrder;
  onOpenActivity?: (activityId: string) => void;
}) {
  if (!order.links.activityId) {
    return (
      <section className="roo-panel" data-testid="roo-activity-panel">
        <h4 className="roo-panel-title">Activité commerciale</h4>
        <p className="roo-panel-text">Aucune activité réseau liée pour cette commande.</p>
      </section>
    );
  }

  return (
    <section className="roo-panel" data-testid="roo-activity-panel">
      <h4 className="roo-panel-title">Activité commerciale liée</h4>
      {order.sponsoredCorridor ? (
        <p className="roo-panel-text">Commande dans un corridor sponsor — réseau actif.</p>
      ) : (
        <p className="roo-panel-text">Suivez l&apos;activité commerciale autour de cette commande.</p>
      )}
      {onOpenActivity ? (
        <button
          type="button"
          className="roo-btn roo-btn--link"
          data-testid="roo-view-activity"
          onClick={() => onOpenActivity(order.links.activityId!)}
        >
          Voir activité
        </button>
      ) : null}
    </section>
  );
}

export const RelationalOrderActivityPanel = memo(RelationalOrderActivityPanelInner);
