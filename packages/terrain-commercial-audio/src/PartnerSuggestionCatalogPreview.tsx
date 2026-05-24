import { memo } from "react";

/** Mini aperçu catalogue (max 3 images) — jamais vide. */
export const PartnerSuggestionCatalogPreview = memo(function PartnerSuggestionCatalogPreview({
  imageUrls,
  displayName,
  partnerRoleLabel,
  city,
  testId = "tca-partner-preview",
}: {
  imageUrls?: string[];
  displayName: string;
  partnerRoleLabel?: string;
  city?: string;
  testId?: string;
}) {
  const imgs = (imageUrls ?? []).slice(0, 3);

  if (!imgs.length) {
    return (
      <div
        data-testid={`${testId}-neutral`}
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: 8,
          background: "var(--venext-surface-raised, #fbfcfb)",
          border: "1px solid var(--venext-border, rgba(23, 32, 28, 0.1))",
          borderRadius: 10,
          minHeight: 56,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "var(--venext-accent-soft, rgba(0, 143, 115, 0.08))",
            color: "var(--venext-accent, #008f73)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
          aria-hidden
        >
          ◆
        </div>
        <div>
          {partnerRoleLabel ? (
            <span style={{ fontSize: 10, color: "var(--venext-accent, #008f73)" }}>{partnerRoleLabel}</span>
          ) : null}
          {city ? <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--venext-text-secondary, #526059)" }}>{city}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div data-testid={`${testId}-images`} style={{ display: "flex", gap: 4 }}>
      {imgs.map((url, i) => (
        <div
          key={url + i}
          data-testid={`${testId}-thumb-${i}`}
          style={{
            width: 48,
            height: 48,
            borderRadius: 6,
            background: `center/cover url(${url}) #1a2420`,
          }}
          title={displayName}
        />
      ))}
    </div>
  );
});
