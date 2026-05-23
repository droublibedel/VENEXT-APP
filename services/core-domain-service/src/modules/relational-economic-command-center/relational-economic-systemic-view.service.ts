import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalEconomicSystemicViewSchema,
  type RelationalEconomicSystemicViewDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicCommandPolicyService } from "./relational-economic-command-policy.service";

const OPEN_TASK_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_EXTERNAL_CONFIRMATION",
  "WAITING_CORRIDOR_VALIDATION",
  "BLOCKED",
] as const;

@Injectable()
export class RelationalEconomicSystemicViewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicCommandPolicyService,
  ) {}

  async resolveCorridorIdsForOrg(organizationId: string, take = 60): Promise<string[]> {
    const rels = await this.prisma.relationship.findMany({
      where: {
        OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        corridorState: { not: "TERMINATED" },
      },
      select: { id: true },
      take,
      orderBy: { createdAt: "desc" },
    });
    return rels.map((r) => r.id);
  }

  async buildSystemicView(organizationId: string, relationshipId?: string): Promise<RelationalEconomicSystemicViewDto> {
    const trimmed = relationshipId?.trim();
    const ids =
      trimmed && trimmed.length > 0 ? [trimmed] : await this.resolveCorridorIdsForOrg(organizationId);

    if (ids.length === 0) {
      const emptyParsed = RelationalEconomicSystemicViewSchema.safeParse({
        globalRiskScore: 0,
        operationalHealthScore: 100,
        corridorFragilityMap: [],
        systemicPressureZones: [],
        dominantFailurePatterns: [],
        criticalDependencies: [],
        propagationHeat: 0,
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true,
        publicTrackingDisabled: true,
      });
      if (!emptyParsed.success) throw new Error(`systemic_view_empty_invalid: ${emptyParsed.error.message}`);
      return emptyParsed.data;
    }

    const rf: Prisma.StringFilter = { in: ids };

    const [
      activeAlerts,
      activeRecs,
      activeOrchs,
      activeSims,
      criticalReviews,
      activeMemories,
      openTasks,
      openIncidents,
      predictiveSignals,
      economicNodes,
    ] = await Promise.all([
      ids.length
        ? this.prisma.relationalOperationalAlert.count({
            where: { relationshipId: rf, resolvedAt: null },
          })
        : Promise.resolve(0),
      ids.length
        ? this.prisma.relationalOperationalRecommendation.count({
            where: { relationshipId: rf, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
          })
        : Promise.resolve(0),
      ids.length
        ? this.prisma.relationalOperationalOrchestration.count({
            where: {
              relationshipId: rf,
              status: { in: ["DRAFT", "ACTIVE", "PAUSED", "WAITING_VALIDATION"] },
            },
          })
        : Promise.resolve(0),
      ids.length
        ? this.prisma.relationalOperationalSimulation.count({
            where: { relationshipId: rf, status: "COMPLETED", severity: "CRITICAL" },
          })
        : Promise.resolve(0),
      ids.length
        ? this.prisma.relationalScenarioReviewBoard.count({
            where: {
              relationshipId: rf,
              decisionSeverity: "CRITICAL",
              reviewStatus: { in: ["PENDING_REVIEW", "UNDER_ANALYSIS"] },
            },
          })
        : Promise.resolve(0),
      ids.length
        ? this.prisma.relationalStrategicMemory.count({
            where: { relationshipId: rf, memoryStatus: "ACTIVE" },
          })
        : Promise.resolve(0),
      ids.length
        ? this.prisma.relationalFulfillmentTask.count({
            where: { relationshipId: rf, taskStatus: { in: [...OPEN_TASK_STATUSES] } },
          })
        : Promise.resolve(0),
      ids.length
        ? this.prisma.relationalFulfillmentIncident.count({
            where: {
              resolutionStatus: { not: "RESOLVED" },
              fulfillmentRecord: { relationshipId: rf },
            },
          })
        : Promise.resolve(0),
      ids.length
        ? this.prisma.relationalPredictiveRiskSignal.count({
            where: {
              relationshipId: rf,
              resolvedAt: null,
            },
          })
        : Promise.resolve(0),
      ids.length
        ? this.prisma.relationalEconomicSignalNode.findMany({
            where: { relationshipId: { in: ids }, nodeType: "CORRIDOR" },
            select: {
              relationshipId: true,
              systemicExposureScore: true,
              dependencyScore: true,
              operationalFragilityScore: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const stressRaw =
      activeAlerts * 4 +
      activeRecs * 3 +
      activeOrchs * 3 +
      activeSims * 5 +
      criticalReviews * 6 +
      activeMemories * 2 +
      openTasks * 2 +
      openIncidents * 5 +
      predictiveSignals * 4;

    const globalRiskScore =
      ids.length === 0 ? 0 : this.policy.clampInt(stressRaw / Math.max(1, ids.length));
    const operationalHealthScore = this.policy.healthFromStress(globalRiskScore);

    type EcoNodeRow = {
      relationshipId: string | null;
      systemicExposureScore: number;
      dependencyScore: number;
      operationalFragilityScore: number;
    };

    const nodes = economicNodes as EcoNodeRow[];

    const propagationHeat =
      nodes.length > 0
        ? this.policy.clampInt(
            nodes.reduce((s: number, n: EcoNodeRow) => s + n.systemicExposureScore, 0) / nodes.length,
          )
        : 0;

    let dominantFailurePatterns: string[] = [];
    if (ids.length) {
      const alertAgg = await this.prisma.relationalOperationalAlert.groupBy({
        by: ["alertType"],
        where: { relationshipId: rf, resolvedAt: null },
        _count: { alertType: true },
      });
      alertAgg.sort((a, b) => b._count.alertType - a._count.alertType);
      dominantFailurePatterns = alertAgg.map((a) => String(a.alertType)).slice(0, 5);
    }

    const corridorFragilityMap = ids.slice(0, 40).map((rid) => {
      const corridorNodes = nodes.filter((n) => n.relationshipId === rid);
      const avg =
        corridorNodes.length > 0
          ? corridorNodes.reduce(
              (s: number, n: EcoNodeRow) => s + n.dependencyScore + n.operationalFragilityScore,
              0,
            ) /
            (corridorNodes.length * 2)
          : globalRiskScore;
      const fragilityScore = this.policy.clampInt(avg);
      return {
        relationshipId: rid,
        fragilityScore,
        controlPriority: this.policy.controlPriorityFromRisk(fragilityScore),
      };
    });

    const criticalDependencies = corridorFragilityMap
      .filter((c) => c.fragilityScore >= 55)
      .slice(0, 50)
      .map((c) => ({
        relationshipId: c.relationshipId,
        dependencyExposure: this.policy.clampInt(c.fragilityScore + propagationHeat / 5),
      }));

    const zones = [...new Set(nodes.filter((n) => n.systemicExposureScore >= 65).map((n) => n.relationshipId ?? ""))]
      .filter(Boolean)
      .slice(0, 40);

    const payload = {
      globalRiskScore,
      operationalHealthScore,
      corridorFragilityMap,
      systemicPressureZones: zones,
      dominantFailurePatterns,
      criticalDependencies,
      propagationHeat,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };

    const parsed = RelationalEconomicSystemicViewSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error(`systemic_view_invalid: ${parsed.error.message}`);
    }
    return parsed.data;
  }
}
