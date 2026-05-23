"use client";

import type { RelationalStrategicMemoryDto } from "@venext/shared-contracts";

export function MemoryPatternSurface(props: { memories: RelationalStrategicMemoryDto[] }) {
  const active = props.memories.filter((m) => m.memoryStatus === "ACTIVE").slice(0, 5);
  if (!active.length) {
    return <p className="text-[9px] text-slate-500">Aucun pattern opérationnel mémorisé.</p>;
  }
  return (
    <ul className="space-y-2 text-[9px]" data-testid="memory-patterns">
      {active.map((m) => (
        <li key={m.id} className="rounded border border-slate-800/80 px-2 py-1.5">
          <p className="font-medium text-slate-200">{m.title}</p>
          <p className="mt-0.5 text-slate-500">{m.observedPattern}</p>
          <p className="mt-0.5 font-mono text-[8px] text-slate-600">
            {m.memoryType} · confiance {m.confidenceLevel}
          </p>
        </li>
      ))}
    </ul>
  );
}
