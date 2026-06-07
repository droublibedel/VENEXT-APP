import { memo } from "react";

import { PartnerSuggestionCatalogPreview, VenextAudioSpeakerButton } from "terrain-commercial-audio";

import type { FeedEntry } from "./relational-feed.types.js";
import { resolveSuggestionDisplayName } from "./relational-partner-suggestion-engine.js";

export const RelationalFeedCard = memo(function RelationalFeedCard({
  entry,
  onInvite,
}: {
  entry: FeedEntry;
  onInvite?: (partnerId: string) => void;
}) {
  const title = resolveSuggestionDisplayName({
    localContactName: entry.localContactName,
    displayName: entry.displayName,
  });

  return (
    <article className="rcf-card" data-testid={`rcf-entry-${entry.id}`} data-type={entry.type}>
      {entry.imageUrl ? (
        <div
          className="rcf-card-image"
          style={{
            aspectRatio: "4/3",
            borderRadius: 10,
            background: `center/cover url(${entry.imageUrl}) #f0f2f1`,
            marginBottom: 8,
          }}
        />
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }} data-testid="rcf-display-name">
            {title}
          </p>
          {entry.partnerRoleLabel ? (
            <span style={{ fontSize: 10, color: "var(--venext-accent, #008f73)" }}>{entry.partnerRoleLabel}</span>
          ) : null}
          {entry.city ? (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--venext-text-secondary, #526059)" }}>{entry.city}</p>
          ) : null}
        </div>
        {entry.businessAudioUrl ? (
          <VenextAudioSpeakerButton
            audioId={`${entry.id}-audio`}
            audioUrl={entry.businessAudioUrl}
            durationSeconds={entry.businessAudioDurationSeconds}
            testId={`rcf-audio-${entry.id}`}
          />
        ) : null}
      </div>
      {entry.sponsored ? (
        <span className="rcf-sponsored-badge" data-testid="rcf-sponsored-badge">
          Sponsorisé
        </span>
      ) : null}
      <PartnerSuggestionCatalogPreview
        imageUrls={entry.catalogPreviewUrls}
        displayName={title}
        partnerRoleLabel={entry.partnerRoleLabel}
        city={entry.city}
        testId={`rcf-preview-${entry.id}`}
      />
      {entry.inviteable && onInvite ? (
        <button
          type="button"
          className="rcf-invite-btn"
          data-testid={`rcf-invite-${entry.partnerId}`}
          onClick={() => onInvite(entry.partnerId)}
          style={{ marginTop: 10, width: "100%", minHeight: 44 }}
        >
          Inviter
        </button>
      ) : null}
    </article>
  );
});
