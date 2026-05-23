import { memo, useMemo } from "react";

import type {
  CommerceLinkedContext,
  CommerceLinkedQuickActionId,
  CommerceLinkedView,
} from "./commerce-linked-context.types";

const ACTION_LABELS: Record<CommerceLinkedQuickActionId, string> = {
  "view-order": "Voir commande",
  "view-settlement": "Voir règlement",
  "confirm-receipt": "Confirmer réception",
  "view-activity": "Voir activité",
  "back-conversation": "Retour conversation",
};

export const CommerceConversationQuickActions = memo(function CommerceConversationQuickActions({
  context,
  activeView,
  onAction,
  variant = "default",
  testId = "cm-linked-quick-actions",
}: {
  context: CommerceLinkedContext;
  activeView: CommerceLinkedView;
  onAction: (action: CommerceLinkedQuickActionId) => void;
  variant?: "default" | "mobile";
  testId?: string;
}) {
  const actions = useMemo(() => {
    const list: CommerceLinkedQuickActionId[] = [];
    if (activeView !== "conversation") {
      list.push("back-conversation");
    }
    if (context.order && activeView !== "order") {
      list.push("view-order");
    }
    if (context.settlement && activeView !== "settlement") {
      list.push("view-settlement");
    }
    if (activeView === "conversation" && context.settlement) {
      list.push("confirm-receipt");
    }
    if (activeView !== "activity") {
      list.push("view-activity");
    }
    return list;
  }, [context.order, context.settlement, activeView]);

  if (!actions.length) return null;

  const isMobile = variant === "mobile";

  return (
    <div
      className={`cm-linked-actions${isMobile ? " cm-linked-actions--mobile" : ""}`}
      data-testid={testId}
    >
      {actions.map((id) => (
        <button
          key={id}
          type="button"
          className={`cm-chip${isMobile ? " cm-chip--touch" : ""}`}
          data-testid={`cm-linked-action-${id}`}
          style={isMobile ? { minHeight: 44 } : undefined}
          onClick={() => onAction(id)}
        >
          {ACTION_LABELS[id]}
        </button>
      ))}
    </div>
  );
});
