"use client";

import type { RelationalOperationalOrchestrationDto } from "@venext/shared-contracts";

export function OrchestrationTimelineSurface(props: { orchestrations: RelationalOperationalOrchestrationDto[] }) {
  const steps = props.orchestrations
    .flatMap((o) => o.steps.map((s) => ({ ...s, orchestrationTitle: o.title, orchestrationStatus: o.status })))
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .slice(0, 12);

  if (steps.length === 0) {
    return <p className="text-[9px] text-slate-500">Aucune étape d&apos;orchestration active.</p>;
  }

  return (
    <ol className="mt-1 space-y-1 border-l border-slate-800 pl-3" data-testid="orchestration-timeline">
      {steps.map((s) => (
        <li key={s.id} className="text-[9px] text-slate-300">
          <span className="font-mono text-cyan-300/80">{s.stepStatus}</span> — {s.stepTitle}{" "}
          <span className="text-slate-500">({s.orchestrationTitle})</span>
        </li>
      ))}
    </ol>
  );
}
