"use client";

import { useCallback, useEffect, useState } from "react";
import type { RelationalOperationalSimulationListDto, RelationalOperationalSimulationOverviewDto } from "@venext/shared-contracts";

import { fetchSimulationOverview, fetchSimulations, runSimulation } from "./simulation-api";
import { SimulationOutcomeSurface } from "./surfaces/SimulationOutcomeSurface";
import { SimulationOverviewSurface } from "./surfaces/SimulationOverviewSurface";
import { SimulationRealtimeStrip } from "./surfaces/SimulationRealtimeStrip";
import { SimulationRiskSurface } from "./surfaces/SimulationRiskSurface";
import { SimulationScenarioSurface } from "./surfaces/SimulationScenarioSurface";

export function RelationalOperationalSimulationPanel(props: {
  organizationId: string | null;
  relationshipId: string | null;
  simulationEnabled: boolean;
  realtimeEnabled: boolean;
  lastRealtimeEvent?: string | null;
}) {
  const { organizationId, relationshipId, simulationEnabled, realtimeEnabled, lastRealtimeEvent } = props;
  const [list, setList] = useState<RelationalOperationalSimulationListDto | null>(null);
  const [overview, setOverview] = useState<RelationalOperationalSimulationOverviewDto | null>(null);

  const reload = useCallback(() => {
    if (!organizationId || !relationshipId || !simulationEnabled) return;
    void fetchSimulations(organizationId, relationshipId).then((r) => {
      if (r.ok) setList(r.data);
    });
    void fetchSimulationOverview(organizationId, relationshipId).then((r) => {
      if (r.ok) setOverview(r.data);
    });
  }, [organizationId, relationshipId, simulationEnabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!simulationEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="operational-simulation-disabled">
        Simulation opérationnelle désactivée (
        <span className="font-mono">relational_operational_simulation_enabled</span>).
      </p>
    );
  }

  if (!relationshipId || !organizationId) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="operational-simulation-missing-relationship">
        Corridor requis pour les projections déterministes (aucune mutation réelle).
      </p>
    );
  }

  const simulations = list?.simulations ?? [];

  return (
    <section className="flex flex-col gap-3" data-testid="relational-operational-simulation">
      <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Centre analytique simulation</p>
        <p className="mt-1 text-[9px] text-slate-500">Stress tests corridor — projections explicables, pas exécution réelle.</p>
        <div className="mt-3">
          <SimulationOverviewSurface overview={overview} />
        </div>
        <button
          type="button"
          className="mt-2 text-[8px] uppercase tracking-wider text-cyan-400/90"
          onClick={() => void runSimulation(organizationId, relationshipId, "SLA_STRESS_TEST").then(() => reload())}
        >
          Lancer stress SLA (simulation)
        </button>
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="simulation-scenario-section">
        <p className="text-[9px] font-medium text-slate-400">Scénarios projetés</p>
        <SimulationScenarioSurface simulations={simulations} />
      </div>

      <div className="rounded border border-amber-900/30 bg-amber-950/20 p-3" data-testid="simulation-risk-section">
        <p className="text-[9px] font-medium text-amber-200/80">Risques projetés</p>
        <SimulationRiskSurface simulations={simulations} />
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="simulation-outcome-section">
        <p className="text-[9px] font-medium text-slate-400">Résultat récent</p>
        <SimulationOutcomeSurface simulations={simulations} />
      </div>

      <SimulationRealtimeStrip realtimeEnabled={realtimeEnabled} lastEvent={lastRealtimeEvent ?? null} />
    </section>
  );
}
