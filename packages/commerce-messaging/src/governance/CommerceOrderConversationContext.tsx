import { memo } from "react";

import { CommerceGovernanceBadge } from "./CommerceGovernanceBadge";
import type {
  CommerceOrderConversationGovernance,
  ResolvedConversationGovernance,
} from "./commerce-conversation-governance.types";

export const CommerceOrderConversationContext = memo(function CommerceOrderConversationContext({
  order,
  governance,
  testId = "cm-order-governance",
}: {
  order: CommerceOrderConversationGovernance | null;
  governance: ResolvedConversationGovernance | null;
  testId?: string;
}) {
  if (!order && !governance?.orderNotice) return null;

  return (
    <div
      data-testid={testId}
      style={{
        padding: "6px 16px",
        fontSize: 12,
        color: "#8fa39a",
        borderBottom: "1px solid rgba(0,168,132,0.06)",
      }}
    >
      {governance?.orderNotice ? <p style={{ margin: 0 }}>{governance.orderNotice}</p> : null}
      {governance?.productNotice ? (
        <p style={{ margin: governance?.orderNotice ? "4px 0 0" : 0 }}>{governance.productNotice}</p>
      ) : null}
      {governance ? (
        <div style={{ marginTop: 6 }}>
          <CommerceGovernanceBadge mode={governance.mode} testId="cm-order-governance-badge" />
        </div>
      ) : null}
    </div>
  );
});
