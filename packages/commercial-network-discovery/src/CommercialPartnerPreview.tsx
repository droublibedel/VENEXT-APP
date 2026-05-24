import { memo } from "react";

import type { CommercialCatalogPreviewData, CommercialContactSuggestion } from "./commercial-network-discovery.types";

export const CommercialPartnerPreview = memo(function CommercialPartnerPreview({
  partner,
  catalog,
  onMessage,
  onQuickOrder,
}: {
  partner: CommercialContactSuggestion | null;
  catalog: CommercialCatalogPreviewData | null;
  onMessage?: () => void;
  onQuickOrder?: () => void;
}) {
  if (!partner) {
    return (
      <section className="cnd-card cnd-panel-hidden" data-testid="cnd-partner-preview-empty">
        <p style={{ margin: 0, fontSize: 11, color: "var(--venext-text-secondary, #526059)" }}>Sélectionnez un contact pour l&apos;aperçu.</p>
      </section>
    );
  }

  return (
    <section className="cnd-card" data-testid="cnd-partner-preview">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className="cnd-avatar">{partner.photoInitials}</div>
        <div>
          <p
            style={{ margin: 0, fontWeight: 700, fontSize: 16, lineHeight: 1.25 }}
            data-testid="cnd-partner-preview-display-name"
          >
            {partner.displayName}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--venext-text-secondary, #526059)", lineHeight: 1.35 }}>
            {partner.secondaryName ?? `${partner.city} · ${partner.activityLabel}`}
          </p>
          {partner.recognitionHint ? (
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "#66746d" }}>{partner.recognitionHint}</p>
          ) : null}
        </div>
      </div>

      {catalog ? (
        <p style={{ margin: "10px 0 0", fontSize: 10, color: "var(--venext-accent, #008f73)" }}>
          {catalog.products.length} produits · mis à jour {catalog.updatedAt}
        </p>
      ) : null}

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {onMessage ? (
          <button type="button" className="cnd-btn" onClick={onMessage} data-testid="cnd-partner-message">
            Contacter
          </button>
        ) : null}
        {onQuickOrder ? (
          <button
            type="button"
            className="cnd-btn cnd-btn--primary"
            onClick={onQuickOrder}
            data-testid="cnd-partner-quick-order"
          >
            Commande rapide
          </button>
        ) : null}
      </div>
    </section>
  );
});
