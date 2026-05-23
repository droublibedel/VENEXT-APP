import { memo, useMemo } from "react";

import { CommerceVirtualList } from "../components/CommerceVirtualList";
import { CommerceGovernanceBadge } from "../governance/CommerceGovernanceBadge";
import type { ConversationMode } from "../governance/commerce-conversation-governance.types";
import type { CommerceConversation, ConversationCategory } from "../hooks/commerce-messaging.types";

const CATEGORY_LABEL: Record<ConversationCategory, string> = {
  commandes: "Commandes",
  produits: "Produits",
  reseau: "Réseau",
  "activite-terrain": "Activité terrain",
};

export const CommerceConversationList = memo(function CommerceConversationList({
  conversations,
  activeId,
  categoryFilter,
  onCategoryChange,
  onSelect,
  governanceEnabled,
  getGovernanceMode,
}: {
  conversations: CommerceConversation[];
  activeId: string | null;
  categoryFilter: ConversationCategory | "all";
  onCategoryChange: (c: ConversationCategory | "all") => void;
  onSelect: (id: string) => void;
  governanceEnabled?: boolean;
  getGovernanceMode?: (conversationId: string) => ConversationMode | undefined;
}) {
  const filtered = useMemo(() => {
    if (categoryFilter === "all") return conversations;
    return conversations.filter((c) => c.category === categoryFilter);
  }, [conversations, categoryFilter]);

  return (
    <>
      <div className="cm-category-tabs" role="tablist" data-testid="cm-category-tabs">
        {(["all", "commandes", "produits", "reseau", "activite-terrain"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            className={`cm-category-tab${categoryFilter === cat ? " cm-category-tab--active" : ""}`}
            data-testid={`cm-cat-${cat}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat === "all" ? "Tout" : CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>
      <CommerceVirtualList
        className="cm-conv-list"
        testId="cm-conversation-list"
        items={filtered}
        keyExtractor={(c) => c.id}
        renderItem={(c) => (
          <button
            type="button"
            className={`cm-conv-item${activeId === c.id ? " cm-conv-item--active" : ""}`}
            data-testid={`cm-conv-${c.id}`}
            onClick={() => onSelect(c.id)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 14 }}>{c.partnerName}</strong>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {governanceEnabled && (getGovernanceMode?.(c.id) ?? c.conversationMode) ? (
                  <CommerceGovernanceBadge
                    mode={(getGovernanceMode?.(c.id) ?? c.conversationMode)!}
                    testId={`cm-conv-governance-${c.id}`}
                  />
                ) : null}
                {c.needsReply ? (
                  <span className="cm-chip" data-testid="cm-needs-reply">
                    Répondre
                  </span>
                ) : null}
              </div>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8fa39a" }}>
              {c.partnerRole} · {c.city}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>{c.recentActivity}</p>
            {c.productName ? (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#00a884" }}>Produit : {c.productName}</p>
            ) : null}
            {c.linkedOrderLabel ? (
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b8078" }}>Commande : {c.linkedOrderLabel}</p>
            ) : null}
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6b8078" }}>{c.activityStatus}</p>
          </button>
        )}
      />
    </>
  );
});
