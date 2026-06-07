import { memo } from "react";

/**
 * Test instrumentation for data source — never shown to end users (VENEXT-UX-CLEANUP-01).
 */
export const VenextHiddenDataSourceMarker = memo(function VenextHiddenDataSourceMarker({
  testId,
  dataSource,
  fallbackUsed,
}: {
  testId: string;
  dataSource: string;
  fallbackUsed: boolean;
}) {
  return (
    <span
      data-testid={testId}
      data-source={dataSource}
      data-fallback={fallbackUsed ? "true" : "false"}
      className="venext-sr-only"
      aria-hidden
    />
  );
});
