import { memo, useEffect } from "react";

import { profileLabel } from "./types.js";
import type { TerrainProfileId } from "./types.js";

export const TerrainProfileTransitionOverlay = memo(function TerrainProfileTransitionOverlay({
  visible,
  profile,
  onComplete,
}: {
  visible: boolean;
  profile: TerrainProfileId | null;
  onComplete?: () => void;
}) {
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => onComplete?.(), 420);
    return () => window.clearTimeout(timer);
  }, [onComplete, visible]);

  if (!visible || !profile) return null;

  return (
    <div
      className="terrain-profile-transition"
      data-testid="terrain-profile-transition"
      role="status"
      aria-live="polite"
    >
      <div className="terrain-profile-transition__card">
        <span className="terrain-profile-transition__spinner" aria-hidden />
        <p className="terrain-profile-transition__label">Préparation de votre espace</p>
        <p className="terrain-profile-transition__sublabel">Mode {profileLabel(profile)}</p>
      </div>
    </div>
  );
});
