import { Injectable } from "@nestjs/common";
import type {
  CoordinationConflict,
  CoordinationRecommendation,
  CrossPolePriority,
  EconomicCoordinationSnapshot,
  EconomicPosture,
  ResponseOrchestration,
} from "@venext/shared-contracts";

@Injectable()
export class ResponseOrchestrationService {
  build(
    snapshot: EconomicCoordinationSnapshot,
    posture: EconomicPosture,
    priorities: CrossPolePriority[],
    conflicts: CoordinationConflict[],
  ): ResponseOrchestration[] {
    const top = priorities.slice(0, 4);
    const recs: CoordinationRecommendation[] = top.map((p, i) => ({
      order: i,
      pole: p.affectedPoles[0] ?? "COORDINATION",
      headline: p.priorityId.replace(/_/g, " "),
      rationale: p.priorityReason,
      symbolicCoordinationOnly: true as const,
    }));

    const orch: ResponseOrchestration = {
      orchestrationId: `orch-${snapshot.organizationId}-primary`,
      title: "Coordinated industrial response sequence (symbolic)",
      rationale: `Derived from posture ${posture.posture} with ${conflicts.length} detected coordination conflict(s). Sequences are not executed — arbitration and manual validation required.`,
      orderedRecommendations: recs,
      coordinationObjective: "Align multi-pole narratives without contradicting finance guardrails, supply feasibility, or relational trust baselines.",
      affectedPoles: [...new Set(top.flatMap((p) => p.affectedPoles))].sort(),
      expectedStabilization: Number(
        Math.min(1, snapshot.scenariosBundle.overview.meanStabilizationProbability * 0.85 + (1 - posture.coordinationStress) * 0.15).toFixed(4),
      ),
      executionComplexity: Number(Math.min(1, 0.25 + top.length * 0.12 + conflicts.length * 0.07).toFixed(4)),
      coordinationRisk: Number(Math.min(1, posture.coordinationStress * 0.55 + conflicts.length * 0.08).toFixed(4)),
    };

    const secondary: ResponseOrchestration | null =
      conflicts.length >= 2
        ? {
            orchestrationId: `orch-${snapshot.organizationId}-deconflict`,
            title: "Deconfliction pass — arbitration queue",
            rationale: "Multiple simultaneous coordination conflicts detected; ordered recommendations bias toward liquidity and distribution sequencing.",
            orderedRecommendations: conflicts.slice(0, 3).map((c, i) => ({
              order: i,
              pole: c.involvedPoles[0] ?? "COORDINATION",
              headline: c.conflictType.replace(/_/g, " "),
              rationale: c.arbitrationDirection,
              symbolicCoordinationOnly: true as const,
            })),
            coordinationObjective: "Surface arbitration directions for executive review — no automatic mediation.",
            affectedPoles: [...new Set(conflicts.flatMap((c) => c.involvedPoles))].sort(),
            expectedStabilization: Number((0.35 + (1 - conflicts[0]!.severity) * 0.25).toFixed(4)),
            executionComplexity: Number(Math.min(1, 0.45 + conflicts.length * 0.1).toFixed(4)),
            coordinationRisk: Number(Math.min(1, conflicts.reduce((m, c) => Math.max(m, c.systemicImpact), 0)).toFixed(4)),
          }
        : null;

    return secondary ? [orch, secondary] : [orch];
  }
}
