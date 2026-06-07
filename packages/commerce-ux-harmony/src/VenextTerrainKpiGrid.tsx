import type { ReactNode } from "react";
import { memo } from "react";

export const VenextTerrainKpiGrid = memo(function VenextTerrainKpiGrid({
  children,
  columns = 3,
  testId = "terrain-kpi-grid",
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  testId?: string;
}) {
  return (
    <div className="vtkg-grid" data-testid={testId} data-columns={columns} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {children}
    </div>
  );
});
