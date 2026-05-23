import { memo } from "react";

import type { ConversationMode } from "./commerce-conversation-governance.types";
import { getGovernanceBadgeLabel } from "./commerce-conversation-governance";

export const CommerceGovernanceBadge = memo(function CommerceGovernanceBadge({
  mode,
  testId = "cm-governance-badge",
}: {
  mode: ConversationMode;
  testId?: string;
}) {
  return (
    <span
      className="cm-chip"
      data-testid={testId}
      data-mode={mode}
      style={{ fontSize: 10, marginLeft: 6 }}
    >
      {getGovernanceBadgeLabel(mode)}
    </span>
  );
});
