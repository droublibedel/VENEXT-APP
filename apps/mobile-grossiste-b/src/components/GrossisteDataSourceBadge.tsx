import { memo } from "react";

import type { GrossisteDataSource } from "../hooks/grossiste-b-data.types";

function label(dataSource: GrossisteDataSource, fallbackUsed: boolean): string {
  if (dataSource === "live" && !fallbackUsed) return "Données synchronisées";
  if (dataSource === "mixed") return "Données synchronisées (complétées)";
  return "Données de démonstration enrichies";
}

export const GrossisteDataSourceBadge = memo(function GrossisteDataSourceBadge({
  dataSource,
  fallbackUsed,
  loading,
}: {
  dataSource: GrossisteDataSource;
  fallbackUsed: boolean;
  loading?: boolean;
}) {
  if (loading) return null;
  return (
    <p
      className="grossiste-b-source"
      data-testid="grossiste-data-source"
      data-source={dataSource}
      data-fallback={fallbackUsed ? "true" : "false"}
    >
      {label(dataSource, fallbackUsed)}
    </p>
  );
});
