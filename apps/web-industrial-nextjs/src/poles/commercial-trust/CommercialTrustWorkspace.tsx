"use client";

import type { CommercialTrustProfileResponseDto } from "@venext/shared-contracts";

import { CommercialTrustDiagnosticsSurface } from "./surfaces/CommercialTrustDiagnosticsSurface";
import { CommercialTrustOverviewSurface } from "./surfaces/CommercialTrustOverviewSurface";
import { CommercialTrustRelationshipSnapshotSurface } from "./surfaces/CommercialTrustRelationshipSnapshotSurface";
import { CommercialTrustSignalsSurface } from "./surfaces/CommercialTrustSignalsSurface";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function CommercialTrustWorkspace({
  data,
  loading,
  error,
  relationshipId,
}: {
  data: CommercialTrustProfileResponseDto | null;
  loading: boolean;
  error: string | null;
  relationshipId?: string | null;
}) {
  if (loading) {
    return <VenextInlineSkeleton />;
  }
  if (error) {
    return <p className="px-4 py-6 text-xs text-amber-300/90">{error}</p>;
  }
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <CommercialTrustOverviewSurface data={data} />
      <CommercialTrustSignalsSurface data={data} />
      <CommercialTrustRelationshipSnapshotSurface relationshipId={relationshipId} />
      <CommercialTrustDiagnosticsSurface data={data} />
    </div>
  );
}
