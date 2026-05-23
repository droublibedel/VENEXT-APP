"use client";

import { useCallback, useEffect, useState } from "react";
import type { RelationalOperationalOrchestrationListDto, RelationalOperationalOrchestrationOverviewDto } from "@venext/shared-contracts";

import {
  approveOrchestration,
  fetchOrchestrationOverview,
  fetchOrchestrations,
  startOrchestration,
} from "./orchestration-api";
import { OrchestrationOverviewSurface } from "./surfaces/OrchestrationOverviewSurface";
import { OrchestrationPrioritySurface } from "./surfaces/OrchestrationPrioritySurface";
import { OrchestrationRealtimeStrip } from "./surfaces/OrchestrationRealtimeStrip";
import { OrchestrationRiskSurface } from "./surfaces/OrchestrationRiskSurface";
import { OrchestrationTimelineSurface } from "./surfaces/OrchestrationTimelineSurface";

export function RelationalOperationalOrchestrationPanel(props: {
  organizationId: string | null;
  relationshipId: string | null;
  orchestrationEnabled: boolean;
  realtimeEnabled: boolean;
  lastRealtimeEvent?: string | null;
}) {
  const { organizationId, relationshipId, orchestrationEnabled, realtimeEnabled, lastRealtimeEvent } = props;
  const [list, setList] = useState<RelationalOperationalOrchestrationListDto | null>(null);
  const [overview, setOverview] = useState<RelationalOperationalOrchestrationOverviewDto | null>(null);

  const reload = useCallback(() => {
    if (!organizationId || !relationshipId || !orchestrationEnabled) return;
    void fetchOrchestrations(organizationId, relationshipId).then((r) => {
      if (r.ok) setList(r.data);
    });
    void fetchOrchestrationOverview(organizationId, relationshipId).then((r) => {
      if (r.ok) setOverview(r.data);
    });
  }, [organizationId, relationshipId, orchestrationEnabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!orchestrationEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="operational-orchestration-disabled">
        Orchestration opérationnelle désactivée (
        <span className="font-mono">relational_operational_orchestration_enabled</span>).
      </p>
    );
  }

  if (!relationshipId || !organizationId) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="operational-orchestration-missing-relationship">
        Corridor requis pour les plans d&apos;orchestration déterministes.
      </p>
    );
  }

  const orchestrations = list?.orchestrations ?? [];

  return (
    <section className="flex flex-col gap-3" data-testid="relational-operational-orchestration">
      <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Centre de pilotage orchestration
        </p>
        <p className="mt-1 text-[9px] text-slate-500">
          Plans séquencés, validation humaine sur chemins critiques — pas autopilot ni assistant IA.
        </p>
        <div className="mt-3">
          <OrchestrationOverviewSurface overview={overview} />
        </div>
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="orchestration-priority-section">
        <p className="text-[9px] font-medium text-slate-400">Priorités d&apos;intervention</p>
        <OrchestrationPrioritySurface
          orchestrations={orchestrations}
          onApprove={(id) => void approveOrchestration(organizationId, id).then(() => reload())}
          onStart={(id) => void startOrchestration(organizationId, id).then(() => reload())}
        />
      </div>

      <div className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="orchestration-timeline-section">
        <p className="text-[9px] font-medium text-slate-400">Timeline opérationnelle</p>
        <OrchestrationTimelineSurface orchestrations={orchestrations} />
      </div>

      <div className="rounded border border-amber-900/30 bg-amber-950/20 p-3" data-testid="orchestration-risk-section">
        <p className="text-[9px] font-medium text-amber-200/80">Risques &amp; containment</p>
        <OrchestrationRiskSurface orchestrations={orchestrations} />
      </div>

      <OrchestrationRealtimeStrip realtimeEnabled={realtimeEnabled} lastEvent={lastRealtimeEvent ?? null} />
    </section>
  );
}
