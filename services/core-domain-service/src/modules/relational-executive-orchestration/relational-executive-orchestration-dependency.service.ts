import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  RelationalExecutiveOrchestrationPolicyService,
  VENEXT_EXECUTIVE_ORCHESTRATION_MAX_DEPTH,
} from "./relational-executive-orchestration-policy.service";
import type { ExecutiveOrchestrationCorridorContext } from "./relational-executive-orchestration-corridor-context.service";

export type ExecutiveOrchestrationDependencyDraft = {
  dependencyCode: string;
  dependencyWeight: number;
  crossCorridorExposure: number;
  coordinationStress: number;
  concentrationScore: number;
  targetRef: string;
};

export type ExecutiveTraversalDiagnostics = {
  traversalDepth: number;
  visitedCorridors: number;
  boundedTraversalApplied: boolean;
};

@Injectable()
export class RelationalExecutiveOrchestrationDependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalExecutiveOrchestrationPolicyService,
  ) {}

  computeExecutiveDependencies(ctx: ExecutiveOrchestrationCorridorContext): ExecutiveOrchestrationDependencyDraft[] {
    return this.detectCriticalExecutiveDependencies(ctx);
  }

  computeCrossCorridorExposure(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.policy.clampInt(ctx.peerRelationshipCount * 14 + ctx.macroDependencyCount * 8);
  }

  computeDependencyConcentration(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.policy.clampInt(
      ctx.sovereigntyDependencyCount * 10 + ctx.continuityDependencyCount * 10 + ctx.supplyFlowEdgeCount * 5,
    );
  }

  computeCoordinationStress(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.policy.clampInt(
      ctx.governanceConflictCount * 12 + ctx.orchestrationOpenCount * 8 + ctx.topExecutivePressure * 0.3,
    );
  }

  detectCriticalExecutiveDependencies(
    ctx: ExecutiveOrchestrationCorridorContext,
  ): ExecutiveOrchestrationDependencyDraft[] {
    const weight = this.policy.clampInt(ctx.dependencyScore * 0.6 + ctx.dependencyExposureScore * 0.4);
    const exposure = this.computeCrossCorridorExposure(ctx);
    const stress = this.computeCoordinationStress(ctx);
    const concentration = this.computeDependencyConcentration(ctx);
    const drafts: ExecutiveOrchestrationDependencyDraft[] = [
      {
        dependencyCode: `EXEC_ORCH_DEP:monitoring:${ctx.relationshipId}`,
        dependencyWeight: weight,
        crossCorridorExposure: exposure,
        coordinationStress: stress,
        concentrationScore: concentration,
        targetRef: "monitoring",
      },
    ];
    if (ctx.activeMonitoringNodeId) {
      drafts.push({
        dependencyCode: `EXEC_ORCH_DEP:stabilization:${ctx.relationshipId}`,
        dependencyWeight: this.policy.clampInt(weight * 0.9),
        crossCorridorExposure: this.policy.clampInt(exposure * 0.85),
        coordinationStress: this.policy.clampInt(stress * 1.05),
        concentrationScore: concentration,
        targetRef: "stabilization",
      });
    }
    return drafts;
  }

  async traverseExecutivePeers(ctx: ExecutiveOrchestrationCorridorContext): Promise<ExecutiveTraversalDiagnostics> {
    if (!ctx.buyerOrganizationId) {
      return { traversalDepth: 0, visitedCorridors: 0, boundedTraversalApplied: true };
    }
    const visited = new Set<string>([ctx.relationshipId]);
    const queue: Array<{ relationshipId: string; depth: number }> = [];
    const peers = await this.prisma.relationship.findMany({
      where: {
        id: { not: ctx.relationshipId },
        OR: [
          { requesterOrganizationId: ctx.buyerOrganizationId },
          { receiverOrganizationId: ctx.buyerOrganizationId },
        ],
        corridorState: { not: "TERMINATED" },
      },
      select: { id: true },
      take: VENEXT_EXECUTIVE_ORCHESTRATION_MAX_DEPTH * 4,
    });
    for (const p of peers) queue.push({ relationshipId: p.id, depth: 1 });
    let maxDepth = 0;
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (cur.depth > VENEXT_EXECUTIVE_ORCHESTRATION_MAX_DEPTH) continue;
      if (visited.has(cur.relationshipId)) continue;
      visited.add(cur.relationshipId);
      maxDepth = Math.max(maxDepth, cur.depth);
    }
    return {
      traversalDepth: maxDepth,
      visitedCorridors: visited.size,
      boundedTraversalApplied: true,
    };
  }
}
