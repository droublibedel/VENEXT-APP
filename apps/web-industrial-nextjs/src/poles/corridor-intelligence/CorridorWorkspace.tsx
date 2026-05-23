"use client";

import type { CommercialCorridorProfileDto } from "@venext/shared-contracts";

import { CorridorDiagnosticsSurface } from "./surfaces/CorridorDiagnosticsSurface";
import { CorridorOverviewSurface } from "./surfaces/CorridorOverviewSurface";
import { CorridorSignalsSurface } from "./surfaces/CorridorSignalsSurface";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function CorridorWorkspace({
  data,
  loading,
  error,
}: {
  data: CommercialCorridorProfileDto | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <VenextInlineSkeleton />;
  }
  if (error) {
    return <p className="px-4 py-6 text-xs text-amber-300/90">{error}</p>;
  }
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <CorridorOverviewSurface data={data} />
      <CorridorSignalsSurface data={data} />
      <CorridorDiagnosticsSurface data={data} />
    </div>
  );
}
