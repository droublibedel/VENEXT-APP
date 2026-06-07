import { memo } from "react";

import { useTerrainProfileRuntime } from "./ProfileRuntimeContext.js";
import { humanizeTerrainProfileSwitchError } from "./terrain-profile-human-errors.js";
import type { TerrainProfileId } from "./types.js";
import { profileLabel } from "./types.js";

export const TerrainProfileSwitchPanel = memo(function TerrainProfileSwitchPanel({
  className = "",
}: {
  className?: string;
}) {
  const { state, activeProfile, switchProfile, switchError, isTransitioning } = useTerrainProfileRuntime();
  const errorMessage = humanizeTerrainProfileSwitchError(switchError);

  return (
    <article className={className} data-testid="terrain-profile-switch-panel">
      <p style={{ margin: 0, fontSize: 13, color: "var(--venext-text-muted, #5c6660)" }}>Profil actif</p>
      <p style={{ margin: "8px 0 12px", fontSize: 16, fontWeight: 700 }}>
        {activeProfile ? profileLabel(activeProfile) : "—"}
      </p>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--venext-text-muted, #5c6660)" }}>
        Changer de profil (sans déconnexion)
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(["grossiste_b", "detaillant"] as TerrainProfileId[]).map((profile) => (
          <button
            key={profile}
            type="button"
            data-testid={`terrain-profile-switch-${profile.replace("_", "-")}`}
            disabled={activeProfile === profile || isTransitioning}
            onClick={() => void switchProfile(profile)}
            style={{
              minHeight: 44,
              borderRadius: 10,
              border: "1px solid var(--venext-border, #e4e8e6)",
              background: activeProfile === profile ? "var(--venext-accent-soft, #e8f5f0)" : "#fff",
              fontWeight: 600,
            }}
          >
            {activeProfile === profile
              ? `Mode ${profileLabel(profile)} (actif)`
              : `Passer en mode ${profileLabel(profile)}`}
          </button>
        ))}
      </div>
      {state.enabledProfiles.length > 1 ? (
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--venext-text-muted, #5c6660)" }}>
          Profils activés : {state.enabledProfiles.map(profileLabel).join(" · ")}
        </p>
      ) : null}
      {errorMessage ? (
        <p
          role="alert"
          data-testid="terrain-profile-switch-error"
          style={{ margin: "12px 0 0", fontSize: 13, color: "var(--venext-danger, #b42318)" }}
        >
          {errorMessage}
        </p>
      ) : null}
      {isTransitioning ? (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--venext-text-muted, #5c6660)" }}>
          Changement de profil…
        </p>
      ) : null}
    </article>
  );
});
