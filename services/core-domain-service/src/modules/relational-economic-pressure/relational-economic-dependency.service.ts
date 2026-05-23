/**
 * Instruction 20.21 — inter-corridor dependency detection (deterministic, no GPS/wallet/social graph).
 */
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicPressurePolicyService } from "./relational-economic-pressure-policy.service";

const OPEN_TASK_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_EXTERNAL_CONFIRMATION",
  "WAITING_CORRIDOR_VALIDATION",
  "BLOCKED",
] as const;

export type CorridorNodeMetrics = {
  dependencyScore: number;
  pressureScore: number;
  fragilityScore: number;
  propagationExposureScore: number;
  dependencyDensity: number;
  systemicWeight: number;
  criticalityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

@Injectable()
export class RelationalEconomicDependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicPressurePolicyService,
  ) {}

  async detectDependencyRelationships(focalRelationshipId: string): Promise<string[]> {
    const order = await this.prisma.order.findFirst({
      where: { relationshipId: focalRelationshipId },
      select: { buyerOrganizationId: true, sellerOrganizationId: true },
      orderBy: { createdAt: "desc" },
    });
    if (!order) return [];
    const orgs = [order.buyerOrganizationId, order.sellerOrganizationId];
    const peerOrders = await this.prisma.order.findMany({
      where: {
        relationshipId: { not: focalRelationshipId },
        OR: [{ buyerOrganizationId: { in: orgs } }, { sellerOrganizationId: { in: orgs } }],
      },
      select: { relationshipId: true },
      distinct: ["relationshipId"],
      take: 30,
    });
    return peerOrders.map((r) => r.relationshipId);
  }

  computeDependencyDensity(edgeCount: number, peerCount: number): number {
    if (peerCount <= 0) return 0;
    return this.policy.clampInt((edgeCount * 100) / Math.max(1, peerCount * 3));
  }

  detectAsymmetricDependency(scoreA: number, scoreB: number): boolean {
    return Math.abs(scoreA - scoreB) >= 28;
  }

  computeCriticalityLevel(metrics: Pick<CorridorNodeMetrics, "pressureScore" | "fragilityScore">): CorridorNodeMetrics["criticalityLevel"] {
    const blend = this.policy.clampInt((metrics.pressureScore + metrics.fragilityScore) / 2);
    return this.policy.severityFromScore(blend);
  }

  async detectSharedOperationalPressure(relationshipId: string): Promise<number> {
    const rf: Prisma.StringFilter = { equals: relationshipId };
    const [tasks, orch] = await Promise.all([
      this.prisma.relationalFulfillmentTask.count({
        where: { relationshipId: rf, taskStatus: { in: [...OPEN_TASK_STATUSES] } },
      }),
      this.prisma.relationalOperationalOrchestration.count({
        where: { relationshipId: rf, status: { in: ["DRAFT", "ACTIVE", "PAUSED", "WAITING_VALIDATION"] } },
      }),
    ]);
    return this.policy.clampInt(tasks * 5 + orch * 4);
  }

  computeSystemicWeight(peerCount: number, graphExposure: number): number {
    return this.policy.clampInt(peerCount * 6 + graphExposure * 0.4);
  }

  async computeNodeMetrics(relationshipId: string): Promise<CorridorNodeMetrics> {
    const rf: Prisma.StringFilter = { equals: relationshipId };
    const [
      alerts,
      recs,
      orchs,
      sims,
      reviews,
      memories,
      predictive,
      openIncidents,
      graphNode,
      sharedPressure,
    ] = await Promise.all([
      this.prisma.relationalOperationalAlert.count({ where: { relationshipId: rf, resolvedAt: null } }),
      this.prisma.relationalOperationalRecommendation.count({
        where: { relationshipId: rf, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
      }),
      this.prisma.relationalOperationalOrchestration.count({
        where: { relationshipId: rf, status: { in: ["DRAFT", "ACTIVE", "PAUSED", "WAITING_VALIDATION"] } },
      }),
      this.prisma.relationalOperationalSimulation.count({
        where: { relationshipId: rf, status: "COMPLETED", severity: "CRITICAL" },
      }),
      this.prisma.relationalScenarioReviewBoard.count({
        where: {
          relationshipId: rf,
          decisionSeverity: "CRITICAL",
          reviewStatus: { in: ["PENDING_REVIEW", "UNDER_ANALYSIS"] },
        },
      }),
      this.prisma.relationalStrategicMemory.count({ where: { relationshipId: rf, memoryStatus: "ACTIVE" } }),
      this.prisma.relationalPredictiveRiskSignal.count({ where: { relationshipId: rf, resolvedAt: null } }),
      this.prisma.relationalFulfillmentIncident.count({
        where: { resolutionStatus: { not: "RESOLVED" }, fulfillmentRecord: { relationshipId } },
      }),
      this.prisma.relationalEconomicSignalNode.findFirst({
        where: { relationshipId, nodeType: "CORRIDOR" },
        select: { systemicExposureScore: true, operationalFragilityScore: true, dependencyScore: true },
      }),
      this.detectSharedOperationalPressure(relationshipId),
    ]);

    const stress =
      alerts * 4 +
      recs * 3 +
      orchs * 3 +
      sims * 5 +
      reviews * 6 +
      memories * 2 +
      predictive * 4 +
      openIncidents * 6;

    const dependencyScore = this.policy.clampInt(
      (graphNode?.dependencyScore ?? 0) + orchs * 5 + recs * 2 + memories * 2,
    );
    const propagationExposureScore = this.policy.clampInt(graphNode?.systemicExposureScore ?? predictive * 6);
    const fragilityScore = this.policy.clampInt(
      (graphNode?.operationalFragilityScore ?? 0) + alerts * 3 + openIncidents * 7,
    );
    const pressureScore = this.policy.clampInt(stress / 2 + sharedPressure);
    const peerIds = await this.detectDependencyRelationships(relationshipId);
    const dependencyDensity = this.computeDependencyDensity(peerIds.length, Math.max(1, peerIds.length));
    const systemicWeight = this.computeSystemicWeight(peerIds.length, propagationExposureScore);

    const criticalityLevel = this.computeCriticalityLevel({ pressureScore, fragilityScore });

    return {
      dependencyScore,
      pressureScore,
      fragilityScore,
      propagationExposureScore,
      dependencyDensity,
      systemicWeight,
      criticalityLevel,
    };
  }
}
