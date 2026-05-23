"use client";

import { useIndustrialFeatureFlags } from "../../hooks/useIndustrialFeatureFlags";

/** Activation diffusion strip — geometry of attention, not campaign tables (Instruction 5 §4). */
export function DiffusionRibbon() {
  const { flags } = useIndustrialFeatureFlags();
  const sponsored = flags.sponsored_visibility_enabled !== false;
  return (
    <div className="mb-1 rounded border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[10px] text-violet-100/90">
      Diffusion field ·{" "}
      {sponsored
        ? "sponsored propagation cooling in SN-DKR-01 while organic gravity holds (mock)"
        : "sponsored overlays suppressed — organic engagement geometry only (flag)"}
    </div>
  );
}
