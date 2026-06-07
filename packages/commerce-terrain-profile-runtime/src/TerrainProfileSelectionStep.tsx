import { memo } from "react";

import type { TerrainProfileId } from "./types.js";
import { profileLabel } from "./types.js";

export const TerrainProfileSelectionStep = memo(function TerrainProfileSelectionStep({
  selected,
  onSelect,
  onContinue,
  submitting = false,
  errorMessage,
}: {
  selected: TerrainProfileId | null;
  onSelect: (profile: TerrainProfileId) => void;
  onContinue: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}) {
  return (
    <section data-testid="terrain-profile-selection">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Commençons</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--venext-text-muted, #5c6660)" }}>
        Choisissez le mode qui correspond à votre activité. Vous pourrez le modifier plus tard dans les paramètres.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {(["grossiste_b", "detaillant"] as const).map((profile) => {
          const active = selected === profile;
          return (
            <button
              key={profile}
              type="button"
              data-testid={`terrain-profile-option-${profile.replace("_", "-")}`}
              data-selected={active ? "true" : "false"}
              onClick={() => onSelect(profile)}
              style={{
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${active ? "var(--venext-accent, #00a884)" : "var(--venext-border, #e4e8e6)"}`,
                background: active ? "var(--venext-accent-soft, #e8f5f0)" : "var(--venext-surface, #fff)",
                color: "var(--venext-text, #1a2420)",
              }}
            >
              <strong style={{ display: "block", fontSize: 15 }}>{profileLabel(profile)}</strong>
              <span style={{ fontSize: 12, color: "var(--venext-text-muted, #5c6660)" }}>
                {profile === "grossiste_b"
                  ? "Distribution, réseau grossiste, ventes terrain."
                  : "Revente, achats fournisseurs, boutique locale."}
              </span>
            </button>
          );
        })}
      </div>
      {errorMessage ? (
        <p
          role="alert"
          data-testid="terrain-profile-error"
          style={{ margin: "0 0 12px", fontSize: 13, color: "#b42318" }}
        >
          {errorMessage}
        </p>
      ) : null}
      <button
        type="button"
        data-testid="terrain-profile-continue"
        disabled={!selected || submitting}
        onClick={onContinue}
        style={{
          width: "100%",
          minHeight: 44,
          borderRadius: 12,
          border: "none",
          background: "var(--venext-accent, #00a884)",
          color: "#fff",
          fontWeight: 600,
          opacity: selected ? 1 : 0.5,
        }}
      >
        {submitting ? "Enregistrement…" : "Continuer"}
      </button>
    </section>
  );
});
