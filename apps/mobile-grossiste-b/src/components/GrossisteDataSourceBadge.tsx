import { memo } from "react";

import { VenextHiddenDataSourceMarker } from "commerce-ux-harmony";

import type { GrossisteDataSource } from "../hooks/grossiste-b-data.types";

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
    <VenextHiddenDataSourceMarker
      testId="grossiste-data-source"
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
    />
  );
});
