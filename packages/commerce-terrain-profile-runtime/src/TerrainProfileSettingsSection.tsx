import { memo } from "react";

import { useTerrainProfileRuntimeOptional } from "./ProfileRuntimeContext.js";
import { TerrainProfileSwitchPanel } from "./TerrainProfileSwitchPanel.js";

export const TerrainProfileSettingsSection = memo(function TerrainProfileSettingsSection({
  className = "",
}: {
  className?: string;
}) {
  const runtime = useTerrainProfileRuntimeOptional();
  if (!runtime?.state.primaryProfile) return null;
  return <TerrainProfileSwitchPanel className={className} />;
});
