import { memo } from "react";

import { VenextHiddenDataSourceMarker } from "commerce-ux-harmony";

import type { DetaillantDataSource } from "../hooks/detaillant-data.types";

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
    <VenextHiddenDataSourceMarker
      testId="detaillant-data-source"
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
    />
  );
});
