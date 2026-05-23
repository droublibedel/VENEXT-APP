import { memo } from "react";

import type { DetaillantDataSource } from "../hooks/detaillant-data.types";

function label(dataSource: DetaillantDataSource, fallbackUsed: boolean): string {
  if (dataSource === "live" && !fallbackUsed) return "Données synchronisées";
  if (dataSource === "mixed") return "Données synchronisées (complétées)";
  return "Données de démonstration enrichies";
}

export const DetaillantDataSourceBadge = memo(function DetaillantDataSourceBadge({
  dataSource,
  fallbackUsed,
  loading,
}: {
  dataSource: DetaillantDataSource;
  fallbackUsed: boolean;
  loading?: boolean;
}) {
  if (loading) return null;
  return (
    <p
      className="detaillant-source"
      data-testid="detaillant-data-source"
      data-source={dataSource}
      data-fallback={fallbackUsed ? "true" : "false"}
    >
      {label(dataSource, fallbackUsed)}
    </p>
  );
});
