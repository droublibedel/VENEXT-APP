import { memo } from "react";

import {
  PartnerSuggestionCatalogPreview,
  VenextAudioSpeakerButton,
  tTerrainAudio,
} from "terrain-commercial-audio";

import type { CommercialContactSuggestion } from "./commercial-network-discovery.types";

function resolveRoleLabel(s: CommercialContactSuggestion): string {
  if (s.partnerRoleLabel) return s.partnerRoleLabel;
  const act = (s.activityLabel ?? "").toLowerCase();
  if (act.includes("producteur")) return "Producteur";
  if (act.includes("grossiste")) return "Grossiste";
  if (act.includes("détaillant") || act.includes("detaillant")) return "Détaillant";
  return s.activityLabel || "Partenaire";
}

export const CommercialRelationshipCard = memo(function CommercialRelationshipCard({
  suggestion,
  onConnect,
  autoAccept,
  connecting,
}: {
  suggestion: CommercialContactSuggestion;
  onConnect: () => void;
  autoAccept: boolean;
  connecting?: boolean;
}) {
  const connected = suggestion.partnerStatus === "connected";
  const subtitle =
    suggestion.secondaryName ?? [suggestion.city, suggestion.activityLabel].filter(Boolean).join(" · ");
  const roleLabel = resolveRoleLabel(suggestion);
  const hasBusinessAudio = Boolean(suggestion.businessAudioUrl && suggestion.businessAudioId);

  return (
    <article className="cnd-card" data-testid={`cnd-relationship-${suggestion.id}`}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div className="cnd-avatar" aria-hidden>
          {suggestion.photoInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{ margin: 0, fontWeight: 700, fontSize: 15, lineHeight: 1.25 }}
            data-testid={`cnd-display-name-${suggestion.id}`}
          >
            {suggestion.displayName}
          </p>
          <p
            data-testid={`cnd-partner-role-${suggestion.id}`}
            style={{ margin: "2px 0 0", fontSize: 10, color: "#00a884" }}
          >
            {roleLabel}
          </p>
          {subtitle ? (
            <p
              style={{ margin: "4px 0 0", fontSize: 11, color: "#8fa39a", lineHeight: 1.35 }}
              data-testid={`cnd-secondary-name-${suggestion.id}`}
            >
              {subtitle}
            </p>
          ) : null}
          {suggestion.recentActivity ? (
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "#00a884" }}>{suggestion.recentActivity}</p>
          ) : null}
          {suggestion.recognitionHint ? (
            <p
              style={{ margin: "6px 0 0", fontSize: 10, color: "#6b7f76" }}
              data-testid={`cnd-recognition-hint-${suggestion.id}`}
            >
              {suggestion.recognitionHint}
            </p>
          ) : null}
        </div>
        {hasBusinessAudio ? (
          <VenextAudioSpeakerButton
            audioId={suggestion.businessAudioId!}
            audioUrl={suggestion.businessAudioUrl}
            durationSeconds={suggestion.businessAudioDurationSeconds}
            testId={`cnd-business-audio-${suggestion.id}`}
          />
        ) : null}
      </div>
      <PartnerSuggestionCatalogPreview
        imageUrls={suggestion.catalogPreviewImageUrls}
        displayName={suggestion.displayName}
        partnerRoleLabel={roleLabel}
        city={suggestion.city}
        testId={`cnd-catalog-preview-${suggestion.id}`}
      />
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        {connected ? (
          <span
            className="cnd-btn"
            style={{ pointerEvents: "none", opacity: 0.85 }}
            data-testid={`cnd-connected-${suggestion.id}`}
          >
            Partenaire connecté
          </span>
        ) : (
          <button
            type="button"
            className={`cnd-btn ${autoAccept ? "cnd-btn--primary" : ""}`}
            onClick={onConnect}
            disabled={connecting}
            data-testid={`cnd-connect-${suggestion.id}`}
          >
            {autoAccept ? tTerrainAudio("invite") + " maintenant" : tTerrainAudio("invite")}
          </button>
        )}
      </div>
    </article>
  );
});
