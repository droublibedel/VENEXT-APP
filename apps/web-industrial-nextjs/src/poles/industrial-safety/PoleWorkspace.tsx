"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { IncidentPulse } from "./widgets/IncidentPulse";

const SLUG = "industrial-safety" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const { flags } = useIndustrialFeatureFlags();
  return (
    <div className="flex min-h-0 flex-col">
      {flags.industrial_safety_enabled !== false ? (
        <IncidentPulse />
      ) : (
        <div className="mb-1 rounded border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
          Industrial safety strip hidden — <span className="font-mono">industrial_safety_enabled</span> off
        </div>
      )}
      <OperationalPoleCanvas poleSlug={SLUG} />
    </div>
  );
}
