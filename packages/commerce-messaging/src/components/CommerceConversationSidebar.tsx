import { memo } from "react";

import { CommerceConversationList } from "../conversations/CommerceConversationList";
import type { CommerceConversation, ConversationCategory } from "../hooks/commerce-messaging.types";

export const CommerceConversationSidebar = memo(function CommerceConversationSidebar({
  conversations,
  activeId,
  categoryFilter,
  onCategoryChange,
  onSelect,
  dataSource,
  fallbackUsed,
  loading,
  governanceEnabled,
  compact,
  getGovernanceMode,
}: {
  conversations: CommerceConversation[];
  activeId: string | null;
  categoryFilter: ConversationCategory | "all";
  onCategoryChange: (c: ConversationCategory | "all") => void;
  onSelect: (id: string) => void;
  dataSource: string;
  fallbackUsed: boolean;
  loading?: boolean;
  governanceEnabled?: boolean;
  compact?: boolean;
  getGovernanceMode?: (conversationId: string) => import("../governance/commerce-conversation-governance.types").ConversationMode | undefined;
}) {
  return (
    <aside
      className={`cm-sidebar${compact ? " cm-sidebar--compact" : ""}`}
      data-testid="cm-conversation-sidebar"
    >
      <p style={{ padding: "12px 14px 0", margin: 0, fontSize: 11, fontWeight: 700, color: "#00a884", letterSpacing: "0.1em" }}>
        MESSAGERIE COMMERCE
      </p>
      {!loading ? (
        <p
          className="cm-source"
          data-testid="cm-data-source"
          data-fallback={fallbackUsed ? "true" : "false"}
          data-source={dataSource}
        >
          {fallbackUsed ? "Données de démonstration enrichies" : "Données synchronisées"}
        </p>
      ) : null}
      <CommerceConversationList
        conversations={conversations}
        activeId={activeId}
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryChange}
        onSelect={onSelect}
        governanceEnabled={governanceEnabled}
        getGovernanceMode={getGovernanceMode}
      />
    </aside>
  );
});
