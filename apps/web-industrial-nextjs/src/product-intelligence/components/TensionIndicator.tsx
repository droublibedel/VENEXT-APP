"use client";

type Props = { level: number };

export function TensionIndicator({ level }: Props) {
  const pct = Math.round(Math.min(1, level) * 100);
  const hue = level > 0.75 ? "from-rose-900 to-rose-500" : "from-amber-900 to-amber-500";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wider text-slate-500">Tension stock</span>
      <div className="h-1 w-full max-w-[120px] overflow-hidden rounded bg-slate-800">
        <div className={`h-full rounded bg-gradient-to-r ${hue}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
