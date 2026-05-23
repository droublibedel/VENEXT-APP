"use client";

import { VenextSkeletonPole } from "commerce-ux-harmony";

/** Skeleton pôle industriel — remplace les blocs pulse génériques (Instruction 20.87). */
export function VenextPanelSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div className="venext-pole-panel-skeleton" aria-busy="true">
      <VenextSkeletonPole tall={tall} />
    </div>
  );
}
