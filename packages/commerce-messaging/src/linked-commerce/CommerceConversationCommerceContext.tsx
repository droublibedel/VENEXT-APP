import { memo, useCallback } from "react";

import type {
  CommerceLinkedContext,
  CommerceLinkedQuickActionId,
  CommerceLinkedView,
} from "./commerce-linked-context.types";
import { CommerceConversationQuickActions } from "./CommerceConversationQuickActions";
import { CommerceLinkedCommerceTimeline } from "./CommerceLinkedCommerceTimeline";
import { CommerceLinkedOrderCard } from "./CommerceLinkedOrderCard";
import { CommerceLinkedTransactionCard } from "./CommerceLinkedTransactionCard";
import { routeLinkedCommerceAction } from "../commercial-context-bridge";
import type { CommercialContextRoutingInput } from "../commercial-context-bridge";

export const CommerceConversationCommerceContext = memo(function CommerceConversationCommerceContext({
  context,
  activeView,
  onViewChange,
  timelineEnabled,
  onConfirmReceipt,
  contextRouting,
  variant = "default",
  testId = "cm-commerce-linked-context",
}: {
  context: CommerceLinkedContext;
  activeView: CommerceLinkedView;
  onViewChange: (view: CommerceLinkedView) => void;
  timelineEnabled?: boolean;
  onConfirmReceipt?: () => void;
  contextRouting?: CommercialContextRoutingInput;
  variant?: "default" | "mobile";
  testId?: string;
}) {
  const handleAction = useCallback(
    (action: CommerceLinkedQuickActionId) => {
      routeLinkedCommerceAction(action, contextRouting, {
        orderId: context.order?.orderId,
        settlementId: context.settlement?.transactionId,
      });
      switch (action) {
        case "view-order":
          onViewChange("order");
          break;
        case "view-settlement":
          onViewChange("settlement");
          break;
        case "view-activity":
          onViewChange("activity");
          break;
        case "back-conversation":
          onViewChange("conversation");
          break;
        case "confirm-receipt":
          onConfirmReceipt?.();
          break;
        default:
          break;
      }
    },
    [onViewChange, onConfirmReceipt, contextRouting, context.order?.orderId, context.settlement?.transactionId],
  );

  const showTimeline =
    timelineEnabled && (activeView === "activity" || activeView === "conversation");

  return (
    <section className="cm-linked-context-panel" data-testid={testId} data-view={activeView}>
      <p className="cm-linked-context-title">Contexte commercial</p>

      <CommerceConversationQuickActions
        context={context}
        activeView={activeView}
        onAction={handleAction}
        variant={variant}
      />

      {activeView === "order" && context.order ? (
        <CommerceLinkedOrderCard order={context.order} />
      ) : null}

      {activeView === "settlement" && context.settlement ? (
        <CommerceLinkedTransactionCard
          settlement={context.settlement}
          partnerName={context.partnerName}
        />
      ) : null}

      {activeView === "conversation" ? (
        <>
          {context.order ? (
            <CommerceLinkedOrderCard order={context.order} compact />
          ) : null}
          {context.settlement ? (
            <CommerceLinkedTransactionCard
              settlement={context.settlement}
              partnerName={context.partnerName}
            />
          ) : null}
        </>
      ) : null}

      {activeView === "activity" || showTimeline ? (
        <CommerceLinkedCommerceTimeline steps={context.timeline} />
      ) : null}

      {activeView !== "conversation" ? (
        <button
          type="button"
          className="cm-linked-back"
          data-testid="cm-linked-back-conversation"
          onClick={() => onViewChange("conversation")}
        >
          Retour conversation
        </button>
      ) : null}
    </section>
  );
});
