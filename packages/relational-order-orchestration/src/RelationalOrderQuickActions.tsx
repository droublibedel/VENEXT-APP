"use client";

import { memo, useMemo } from "react";

import { getAvailableQuickActions } from "./relational-order-governance";
import type {
  RelationalCommercialOrder,
  RelationalOrderActorRole,
  RelationalOrderOrchestrationFlags,
  RelationalOrderQuickActionId,
} from "./relational-order-orchestration.types";

const ACTION_LABELS: Record<RelationalOrderQuickActionId, string> = {
  "validate-order": "Valider commande",
  "confirm-preparation": "Confirmer préparation",
  "mark-shipped": "Marquer expédiée",
  "confirm-delivery": "Confirmer livraison",
  "confirm-reception": "Confirmer réception",
  "view-settlement": "Voir règlement",
  "open-conversation": "Ouvrir conversation",
  "open-mail": "Ouvrir mail",
  "view-activity": "Voir activité",
};

function RelationalOrderQuickActionsInner({
  order,
  actorRole,
  flags = {},
  onAction,
}: {
  order: RelationalCommercialOrder;
  actorRole: RelationalOrderActorRole;
  flags?: RelationalOrderOrchestrationFlags;
  onAction?: (actionId: RelationalOrderQuickActionId) => void;
}) {
  const actions = useMemo(
    () => getAvailableQuickActions(actorRole, order, flags),
    [actorRole, order, flags],
  );

  if (actions.length === 0) return null;

  return (
    <div className="roo-quick-actions" data-testid="roo-quick-actions">
      {actions.map((id) => (
        <button
          key={id}
          type="button"
          className="roo-btn roo-btn--action"
          data-testid={`roo-action-${id}`}
          onClick={() => onAction?.(id)}
        >
          {ACTION_LABELS[id]}
        </button>
      ))}
    </div>
  );
}

export const RelationalOrderQuickActions = memo(RelationalOrderQuickActionsInner);
