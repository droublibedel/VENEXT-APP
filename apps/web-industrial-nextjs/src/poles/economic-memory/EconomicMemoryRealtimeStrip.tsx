"use client";

type Props = {
  demoMode: boolean;
};

export function EconomicMemoryRealtimeStrip({ demoMode }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-slate-800 bg-slate-950/60 px-2 py-1 text-[10px] text-slate-400">
      <span className="font-mono text-cyan-200/90">ECONOMIC_MEMORY</span>
      <span className="text-slate-500">{demoMode ? "demo.economic_memory.*" : "live.economic_memory.*"}</span>
    </div>
  );
}
