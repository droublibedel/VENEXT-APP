"use client";

import type { RelationalOperationalSimulationDto } from "@venext/shared-contracts";

export function SimulationScenarioSurface(props: { simulations: RelationalOperationalSimulationDto[] }) {
  const scenarios = props.simulations.flatMap((s) =>
    s.scenarios.map((sc) => ({ ...sc, simulationTitle: s.title })),
  );
  if (scenarios.length === 0) {
    return <p className="text-[9px] text-slate-500">Aucun scénario simulé.</p>;
  }
  return (
    <ul className="mt-1 space-y-1" data-testid="simulation-scenarios">
      {scenarios.slice(0, 10).map((sc) => (
        <li key={sc.id} className="text-[9px] text-slate-300">
          {sc.scenarioTitle} — <span className="text-slate-500">{sc.simulationTitle}</span>
        </li>
      ))}
    </ul>
  );
}
