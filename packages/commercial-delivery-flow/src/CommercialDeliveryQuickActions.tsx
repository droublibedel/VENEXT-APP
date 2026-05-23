"use client";

import { memo, useMemo } from "react";

import { getAvailableDeliveryQuickActions } from "./commercial-delivery-governance";
import type {
  CommercialDelivery,
  CommercialDeliveryActorRole,
  CommercialDeliveryFlowFlags,
  CommercialDeliveryQuickActionId,
} from "./commercial-delivery-flow.types";

const LABELS: Record<CommercialDeliveryQuickActionId, string> = {
  "confirm-departure": "Confirmer départ",
  "mark-arriving": "Marquer arrivée proche",
  "confirm-delivery": "Confirmer livraison",
  "confirm-reception": "Confirmer réception",
  "view-linked-order": "Voir commande liée",
  "view-settlement": "Voir règlement lié",
  "open-conversation": "Ouvrir conversation",
  "open-mail": "Ouvrir mail",
  "view-terrain-activity": "Voir activité terrain",
};

function CommercialDeliveryQuickActionsInner({
  delivery,
  actorRole,
  flags = {},
  onAction,
}: {
  delivery: CommercialDelivery;
  actorRole: CommercialDeliveryActorRole;
  flags?: CommercialDeliveryFlowFlags;
  onAction?: (id: CommercialDeliveryQuickActionId) => void;
}) {
  const actions = useMemo(
    () => getAvailableDeliveryQuickActions(actorRole, delivery, flags),
    [actorRole, delivery, flags],
  );

  if (actions.length === 0) return null;

  return (
    <div className="cdf-quick-actions" data-testid="cdf-quick-actions">
      {actions.map((id) => (
        <button
          key={id}
          type="button"
          className="cdf-btn cdf-btn--action"
          data-testid={`cdf-action-${id}`}
          onClick={() => onAction?.(id)}
        >
          {LABELS[id]}
        </button>
      ))}
    </div>
  );
}

export const CommercialDeliveryQuickActions = memo(CommercialDeliveryQuickActionsInner);
