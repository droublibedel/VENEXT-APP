"use client";

type Props = { velocity: number; lowBandwidth?: boolean };

export function DemandIndicator({ velocity, lowBandwidth }: Props) {
  const pct = Math.round(Math.min(1, velocity) * 100);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wider text-slate-500">Demande</span>
      <div className="h-1 w-full max-w-[120px] overflow-hidden rounded bg-slate-800">
        <div
          className={`h-full rounded bg-gradient-to-r from-cyan-900 to-cyan-400 ${lowBandwidth ? "" : "transition-[width] duration-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
