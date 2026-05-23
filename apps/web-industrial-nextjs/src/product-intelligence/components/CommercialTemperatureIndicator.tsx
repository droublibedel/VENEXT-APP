"use client";

import type { CommercialTemperature } from "../types";

const LABEL: Record<CommercialTemperature, string> = {
  COLD: "Froid",
  STABLE: "Stable",
  ACTIVE: "Actif",
  HOT: "Chaud",
  CRITICAL: "Critique",
};

const BAR: Record<CommercialTemperature, string> = {
  COLD: "from-slate-700 to-slate-600",
  STABLE: "from-cyan-900 to-cyan-700",
  ACTIVE: "from-emerald-800 to-emerald-500",
  HOT: "from-amber-800 to-amber-500",
  CRITICAL: "from-rose-900 to-rose-500",
};

type Props = { temperature: CommercialTemperature };

export function CommercialTemperatureIndicator({ temperature }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${BAR[temperature] ?? BAR.STABLE}`}
        title={LABEL[temperature]}
      />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">
        {LABEL[temperature]}
      </span>
    </div>
  );
}
