import { memo, useCallback, useMemo, useState } from "react";
import {
  buildVisibleMessageWindow,
  nextOlderMessageOffset,
} from "commerce-performance-foundation";

import type { CommerceMessage } from "../hooks/commerce-messaging.types";
import { groupMessagesByDate } from "./message-date-groups.js";
import { VenextVoiceMessageBubble } from "../voice/VenextVoiceMessageBubble.js";

function businessContextBadgeLabel(context: CommerceMessage["businessContext"]): string | null {
  if (!context) return null;
  if (context === "grossiste_distribution") return "Grossiste";
  if (context === "retailer_procurement") return "Détaillant";
  if (context === "mixed_relationship") return "Mixte";
  return null;
}

export const CommerceMessageThread = memo(function CommerceMessageThread({
  messages,
  testId = "cm-message-thread",
  virtualizationEnabled = true,
  onDeleteMessage,
  terrainMode = false,
  showBusinessContextBadge = false,
}: {
  messages: CommerceMessage[];
  testId?: string;
  virtualizationEnabled?: boolean;
  /** Suppression globale VENEXT */
  onDeleteMessage?: (messageId: string) => void;
  terrainMode?: boolean;
  showBusinessContextBadge?: boolean;
}) {
  const [olderOffset, setOlderOffset] = useState(0);

  const visibleMessages = useMemo(
    () => messages.filter((m) => !m.deletedGlobally),
    [messages],
  );

  const windowState = useMemo(() => {
    if (!virtualizationEnabled || visibleMessages.length <= 40) {
      return {
        visible: visibleMessages,
        hasOlder: false,
      };
    }
    return buildVisibleMessageWindow(visibleMessages, { olderOffset });
  }, [visibleMessages, olderOffset, virtualizationEnabled]);

  const dateGroups = useMemo(
    () => (terrainMode ? groupMessagesByDate(windowState.visible) : null),
    [terrainMode, windowState.visible],
  );

  const loadOlder = useCallback(() => {
    setOlderOffset((prev) => nextOlderMessageOffset(prev));
  }, []);

  const renderMessage = (m: CommerceMessage) => {
    const isSelf = m.author === "self";
    if (m.kind === "voice") {
      return (
        <VenextVoiceMessageBubble
          key={m.id}
          message={m}
          isSelf={isSelf}
          onDelete={isSelf ? onDeleteMessage : undefined}
          showBusinessContextBadge={showBusinessContextBadge}
        />
      );
    }
    const badge = showBusinessContextBadge ? businessContextBadgeLabel(m.businessContext) : null;
    const isCard = m.kind !== "text" && m.kind !== "image";
    return (
      <article
        key={m.id}
        data-testid={`cm-msg-${m.id}`}
        className={`cm-bubble ${isSelf ? "cm-bubble--self" : "cm-bubble--partner"}${isCard ? " cm-bubble--card" : ""}`}
      >
        {badge ? (
          <span className="cm-bubble-business-badge" data-testid="cm-msg-business-badge">
            {badge}
          </span>
        ) : null}
        {m.kind === "image" && m.imageUrl ? (
          <img
            src={m.imageUrl}
            alt=""
            data-testid="cm-msg-image"
            style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 4 }}
          />
        ) : null}
        {isCard ? (
          <p style={{ margin: "0 0 4px", fontSize: 10, textTransform: "uppercase", color: "#526059" }}>
            {m.kind === "product"
              ? "Produit"
              : m.kind === "order"
                ? "Commande"
                : m.kind === "catalog_share"
                  ? "Catalogue"
                  : m.kind === "document"
                    ? "Document"
                    : "Activité"}
          </p>
        ) : null}
        {m.text ? <p style={{ margin: 0 }}>{m.text}</p> : null}
        {m.attachmentLabel ? (
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#00a884" }}>{m.attachmentLabel}</p>
        ) : null}
        {m.documentName ? (
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>{m.documentName}</p>
        ) : null}
        <p style={{ margin: "6px 0 0", fontSize: 10, color: "#66746d", textAlign: "right" }}>
          {m.displayTime ?? m.at}
        </p>
        {isSelf && onDeleteMessage ? (
          <button
            type="button"
            data-testid="cm-msg-delete"
            onClick={() => onDeleteMessage(m.id)}
            style={{ fontSize: 10, color: "#526059", background: "none", border: "none", marginTop: 4 }}
          >
            Supprimer
          </button>
        ) : null}
      </article>
    );
  };

  return (
    <div className="cm-thread" data-testid={testId} role="log" aria-live="polite">
      {windowState.hasOlder ? (
        <button
          type="button"
          className="cm-load-older"
          data-testid="cm-load-older-messages"
          onClick={loadOlder}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 8,
            padding: "8px 12px",
            fontSize: 13,
            background: "transparent",
            border: "1px dashed #2a3530",
            color: "#526059",
            borderRadius: 8,
          }}
        >
          Afficher les messages précédents
        </button>
      ) : null}
      {terrainMode && dateGroups
        ? dateGroups.map((g) => (
            <section key={g.groupLabel} data-testid={`cm-date-group-${g.groupLabel}`}>
              <p
                className="cm-date-separator"
                data-testid="cm-date-separator"
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "#526059",
                  margin: "12px 0",
                  padding: "4px 12px",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 8,
                  display: "inline-block",
                  width: "100%",
                }}
              >
                {g.groupLabel}
              </p>
              {g.messages.map(renderMessage)}
            </section>
          ))
        : windowState.visible.map(renderMessage)}
    </div>
  );
});
