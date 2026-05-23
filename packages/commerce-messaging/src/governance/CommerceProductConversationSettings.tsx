import { memo } from "react";

import { CommerceGovernanceBadge } from "./CommerceGovernanceBadge";
import type { CommerceProductConversationSettings } from "./commerce-conversation-governance.types";

export const CommerceProductConversationSettingsCard = memo(
  function CommerceProductConversationSettingsCard({
    settings,
    productName,
    testId = "cm-product-governance",
  }: {
    settings: CommerceProductConversationSettings | null;
    productName?: string;
    testId?: string;
  }) {
    if (!settings) return null;

    return (
      <div
        data-testid={testId}
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          padding: "4px 16px",
          fontSize: 11,
          color: "#8fa39a",
        }}
      >
        {productName ? <span>{productName}</span> : null}
        {!settings.conversationEnabled ? (
          <CommerceGovernanceBadge mode="DISABLED" testId="cm-product-governance-badge" />
        ) : (
          <CommerceGovernanceBadge
            mode={settings.conversationMode}
            testId="cm-product-governance-badge"
          />
        )}
      </div>
    );
  },
);
