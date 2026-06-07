import { memo } from "react";

import type { TerrainProfileId } from "./types.js";
import { profileLabel } from "./types.js";

export const TerrainProfileHostUnavailable = memo(function TerrainProfileHostUnavailable({
  profile,
}: {
  profile: TerrainProfileId;
}) {
  return (
    <div
      className="terrain-profile-shell terrain-profile-unavailable"
      data-testid="terrain-profile-host-unavailable"
      data-profile={profile}
    >
      <main style={{ padding: 24 }}>
        <p style={{ margin: 0, fontSize: 12, color: "var(--venext-text-muted, #5c6660)" }}>Profil {profileLabel(profile)}</p>
        <h1 style={{ margin: "12px 0 8px", fontSize: 20, fontWeight: 800 }}>
          Interface non disponible
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--venext-text-secondary, #3d4540)", lineHeight: 1.5 }}>
          Ce profil n&apos;est pas activé pour votre compte. Changez de profil dans les réglages ou contactez votre
          réseau Venext.
        </p>
      </main>
    </div>
  );
});
