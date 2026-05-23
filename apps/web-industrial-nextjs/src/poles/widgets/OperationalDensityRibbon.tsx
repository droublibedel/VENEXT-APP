"use client";

/** Moving density ribbon — kinetic, not KPI cards (Instruction 5 §10). */
export function OperationalDensityRibbon() {
  const cells = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    h: 12 + ((i * 17) % 40),
    a: 0.25 + ((i * 13) % 70) / 100,
  }));
  return (
    <div className="flex h-10 items-end gap-0.5 overflow-hidden rounded border border-slate-800/80 bg-black/40 px-1 py-1">
      {cells.map((c) => (
        <span
          key={c.id}
          className="w-1 rounded-sm bg-gradient-to-t from-cyan-700 to-cyan-300"
          style={{ height: `${c.h}px`, opacity: c.a }}
        />
      ))}
    </div>
  );
}
