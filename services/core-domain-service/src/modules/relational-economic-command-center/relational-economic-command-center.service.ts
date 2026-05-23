import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type {
  RelationalEconomicCommandCenterRealtimeEventType,
  RelationalEconomicCommandCenterSeverityDto,
} from "@venext/shared-contracts";
import {
  RelationalEconomicCommandCenterArchiveRequestSchema,
  RelationalEconomicCommandCenterArchiveResponseSchema,
  RelationalEconomicCommandCenterClusterListSchema,
  RelationalEconomicCommandCenterOverviewSchema,
  RelationalEconomicCommandCenterSnapshotListSchema,
  RelationalEconomicCommandCenterSnapshotSchema,
  RelationalEconomicCriticalCorridorListSchema,
  type RelationalEconomicClusterViewDto,
  type RelationalEconomicCommandCenterArchiveResponseDto,
  type RelationalEconomicCommandCenterOverviewDto,
  type RelationalEconomicCommandCenterSnapshotDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicClusterService } from "../relational-economic-signal-graph/relational-economic-cluster.service";
import { RelationalEconomicPropagationService } from "../relational-economic-signal-graph/relational-economic-propagation.service";
import { RelationalEconomicCommandPolicyService } from "./relational-economic-command-policy.service";
import { RelationalEconomicCommandRealtimeService } from "./relational-economic-command-realtime.service";
import { RelationalEconomicSystemicViewService } from "./relational-economic-systemic-view.service";

type CorridorParties = {
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  corridorState: string;
};

@Injectable()
export class RelationalEconomicCommandCenterService {
  private readonly log = new Logger(RelationalEconomicCommandCenterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly commandPolicy: RelationalEconomicCommandPolicyService,
    private readonly systemic: RelationalEconomicSystemicViewService,
    private readonly propagation: RelationalEconomicPropagationService,
    private readonly clusters: RelationalEconomicClusterService,
    private readonly realtime: RelationalEconomicCommandRealtimeService,
  ) {}

  private async assertObservation(relationshipId: string): Promise<CorridorParties> {
    await this.corridorPolicy.assertCorridorOperational(relationshipId, "operational_observation");
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true, corridorState: true },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    const order = await this.prisma.order.findFirst({
      where: { relationshipId },
      select: { buyerOrganizationId: true, sellerOrganizationId: true },
      orderBy: { createdAt: "desc" },
    });
    if (order) {
      return {
        buyerOrganizationId: order.buyerOrganizationId,
        sellerOrganizationId: order.sellerOrganizationId,
        corridorState: rel.corridorState,
      };
    }
    return {
      buyerOrganizationId: rel.requesterOrganizationId,
      sellerOrganizationId: rel.receiverOrganizationId,
      corridorState: rel.corridorState,
    };
  }

  private toSnapshotDto(row: {
    id: string;
    relationshipId: string | null;
    snapshotCode: string;
    viewType: import("@prisma/client").RelationalEconomicCommandCenterViewType;
    severity: import("@prisma/client").RelationalEconomicCommandCenterSeverity;
    lifecycleStatus: import("@prisma/client").RelationalEconomicCommandCenterStatus;
    globalRiskScore: number;
    systemicPressureScore: number;
    operationalHealthScore: number;
    coordinationStressScore: number;
    fulfillmentPressureScore: number;
    propagationExposureScore: number;
    activeAlertsCount: number;
    activeRecommendationsCount: number;
    activeOrchestrationsCount: number;
    activeSimulationsCount: number;
    activeCriticalReviewsCount: number;
    activeStrategicMemoriesCount: number;
    computedAt: Date;
    createdAt: Date;
  }): RelationalEconomicCommandCenterSnapshotDto {
    const dto = {
      id: row.id,
      relationshipId: row.relationshipId,
      snapshotCode: row.snapshotCode,
      viewType: row.viewType,
      severity: row.severity,
      lifecycleStatus: row.lifecycleStatus,
      globalRiskScore: row.globalRiskScore,
      systemicPressureScore: row.systemicPressureScore,
      operationalHealthScore: row.operationalHealthScore,
      coordinationStressScore: row.coordinationStressScore,
      fulfillmentPressureScore: row.fulfillmentPressureScore,
      propagationExposureScore: row.propagationExposureScore,
      activeAlertsCount: row.activeAlertsCount,
      activeRecommendationsCount: row.activeRecommendationsCount,
      activeOrchestrationsCount: row.activeOrchestrationsCount,
      activeSimulationsCount: row.activeSimulationsCount,
      activeCriticalReviewsCount: row.activeCriticalReviewsCount,
      activeStrategicMemoriesCount: row.activeStrategicMemoriesCount,
      computedAt: row.computedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicCommandCenterSnapshotSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "command_center_snapshot_contract_invalid" });
    return p.data;
  }

  async getOverview(organizationId: string): Promise<RelationalEconomicCommandCenterOverviewDto> {
    const ids = await this.systemic.resolveCorridorIdsForOrg(organizationId);
    const systemic = await this.systemic.buildSystemicView(organizationId);
    const critical = await this.detectCriticalCorridors(organizationId);
    const last = await this.prisma.relationalEconomicCommandCenterSnapshot.findFirst({
      where: {
        OR: [
          { snapshotCode: { startsWith: `NETWORK:${organizationId}:` } },
          {
            relationship: {
              OR: [
                { requesterOrganizationId: organizationId },
                { receiverOrganizationId: organizationId },
              ],
            },
          },
        ],
        lifecycleStatus: "ACTIVE",
      },
      orderBy: { computedAt: "desc" },
    });
    const payload = {
      organizationId,
      latestSnapshotId: last?.id ?? null,
      corridorCountUnderSupervision: ids.length,
      criticalCorridorCount: critical.corridors.length,
      globalRiskScore: systemic.globalRiskScore,
      operationalHealthScore: systemic.operationalHealthScore,
      systemicPressureScore: systemic.propagationHeat,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicCommandCenterOverviewSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "command_center_overview_invalid" });
    return p.data;
  }

  async getSystemicView(organizationId: string, relationshipId?: string) {
    return this.systemic.buildSystemicView(organizationId, relationshipId?.trim() || undefined);
  }

  async listSnapshots(organizationId: string, relationshipId?: string) {
    const where: Prisma.RelationalEconomicCommandCenterSnapshotWhereInput = {
      lifecycleStatus: "ACTIVE",
    };
    if (relationshipId?.trim()) {
      where.relationshipId = relationshipId.trim();
    } else {
      where.OR = [
        { snapshotCode: { startsWith: `NETWORK:${organizationId}:` } },
        {
          relationship: {
            OR: [
              { requesterOrganizationId: organizationId },
              { receiverOrganizationId: organizationId },
            ],
          },
        },
      ];
    }
    const rows = await this.prisma.relationalEconomicCommandCenterSnapshot.findMany({
      where,
      orderBy: { computedAt: "desc" },
      take: 100,
    });
    const payload = {
      snapshots: rows.map((r) => this.toSnapshotDto(r)),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicCommandCenterSnapshotListSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "command_center_snapshot_list_invalid" });
    return p.data;
  }

  async getSnapshotById(organizationId: string, id: string): Promise<RelationalEconomicCommandCenterSnapshotDto> {
    const row = await this.prisma.relationalEconomicCommandCenterSnapshot.findFirst({
      where: {
        id,
        lifecycleStatus: "ACTIVE",
        OR: [
          { snapshotCode: { startsWith: `NETWORK:${organizationId}:` } },
          {
            relationship: {
              OR: [
                { requesterOrganizationId: organizationId },
                { receiverOrganizationId: organizationId },
              ],
            },
          },
        ],
      },
    });
    if (!row) throw new NotFoundException({ code: "command_center_snapshot_not_found" });
    return this.toSnapshotDto(row);
  }

  async getClusterPressure(organizationId: string, relationshipId?: string) {
    void organizationId;
    const clusters = relationshipId?.trim()
      ? await this.clusters.buildOperationalClusters(relationshipId.trim())
      : await this.clusters.buildOperationalClusters(undefined);
    const mapped: RelationalEconomicClusterViewDto[] = clusters.slice(0, 40).map((c) => ({
      clusterCode: c.clusterCode,
      pressureScore: c.sharedOperationalPressure,
      corridorCount: c.corridorCount,
      severity:
        c.clusterRisk === "LOW"
          ? "LOW"
          : c.clusterRisk === "HIGH"
            ? "HIGH"
            : c.clusterRisk === "CRITICAL"
              ? "CRITICAL"
              : "MEDIUM",
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    }));
    const payload = {
      clusters: mapped,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicCommandCenterClusterListSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "command_center_cluster_invalid" });
    return p.data;
  }

  async detectCriticalCorridors(organizationId: string) {
    const ids = await this.systemic.resolveCorridorIdsForOrg(organizationId, 50);
    const corridors: Array<{
      relationshipId: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      pressureScore: number;
      dependencyExposure: number;
      collapseProbability: number;
      controlPriority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
      paymentExecutionDisabled: true;
      publicTrackingDisabled: true;
    }> = [];
    for (const rid of ids) {
      const systemicScoped = await this.systemic.buildSystemicView(organizationId, rid);
      const fragile = systemicScoped.corridorFragilityMap.find((x) => x.relationshipId === rid);
      const exposure = systemicScoped.criticalDependencies.find((x) => x.relationshipId === rid);
      const pressure = fragile?.fragilityScore ?? systemicScoped.globalRiskScore;
      let collapse = pressure / 100;
      try {
        const propRisk = await this.propagation.detectPropagationRisk(rid);
        collapse =
          this.commandPolicy.clampInt(Math.round((collapse + propRisk.collapseProbability) * 50)) / 100;
      } catch {
        /* graph may lack node */
      }
      if (pressure < 60 && systemicScoped.globalRiskScore < 70) continue;

      corridors.push({
        relationshipId: rid,
        severity: this.commandPolicy.severityFromRiskScore(pressure),
        pressureScore: pressure,
        dependencyExposure: exposure?.dependencyExposure ?? pressure,
        collapseProbability: Math.min(1, collapse),
        controlPriority: this.commandPolicy.controlPriorityFromRisk(pressure),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      });
    }
    const out = RelationalEconomicCriticalCorridorListSchema.safeParse({
      corridors: corridors.slice(0, 60),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!out.success) throw new BadRequestException({ code: "command_center_critical_invalid" });
    return out.data;
  }

  async generateCommandCenterSnapshot(input: {
    relationshipId: string;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalEconomicCommandCenterSnapshotDto> {
    const parties = await this.assertObservation(input.relationshipId);
    if (!this.commandPolicy.canMutateCommandSnapshot(parties.corridorState)) {
      throw new ForbiddenException({ code: "command_center_corridor_terminated" });
    }

    const rf: Prisma.StringFilter = { equals: input.relationshipId };
    const [
      activeAlerts,
      activeRecs,
      activeOrchs,
      activeSims,
      criticalReviews,
      activeMemories,
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
      this.prisma.relationalStrategicMemory.count({
        where: { relationshipId: rf, memoryStatus: "ACTIVE" },
      }),
    ]);

    const openTasks = await this.prisma.relationalFulfillmentTask.count({
      where: {
        relationshipId: input.relationshipId,
        taskStatus: { in: ["OPEN", "IN_PROGRESS", "WAITING_EXTERNAL_CONFIRMATION", "WAITING_CORRIDOR_VALIDATION", "BLOCKED"] },
      },
    });
    const openIncidents = await this.prisma.relationalFulfillmentIncident.count({
      where: {
        resolutionStatus: { not: "RESOLVED" },
        fulfillmentRecord: { relationshipId: input.relationshipId },
      },
    });

    const orgForView =
      parties.buyerOrganizationId === input.actorOrganizationId
        ? parties.buyerOrganizationId
        : parties.sellerOrganizationId;
    const systemic = await this.systemic.buildSystemicView(orgForView, input.relationshipId);
    const prop = await this.propagation.detectPropagationRisk(input.relationshipId);

    const globalRiskScore = systemic.globalRiskScore;
    const operationalHealthScore = systemic.operationalHealthScore;
    const coordinationStressScore = this.commandPolicy.clampInt(activeOrchs * 4 + openTasks * 3);
    const fulfillmentPressureScore = this.commandPolicy.clampInt(openIncidents * 8 + activeAlerts * 2);
    const propagationExposureScore = this.commandPolicy.clampInt(prop.exposureScore);
    const systemicPressureScore = systemic.propagationHeat;
    const severity = this.commandPolicy.severityFromRiskScore(globalRiskScore);
    const snapshotCode = `CORRIDOR:${input.relationshipId}:${randomUUID().slice(0, 12)}`;

    const row = await this.prisma.relationalEconomicCommandCenterSnapshot.create({
      data: {
        relationshipId: input.relationshipId,
        snapshotCode,
        viewType: "SINGLE_CORRIDOR",
        severity,
        globalRiskScore,
        systemicPressureScore,
        operationalHealthScore,
        coordinationStressScore,
        fulfillmentPressureScore,
        propagationExposureScore,
        activeAlertsCount: activeAlerts,
        activeRecommendationsCount: activeRecs,
        activeOrchestrationsCount: activeOrchs,
        activeSimulationsCount: activeSims,
        activeCriticalReviewsCount: criticalReviews,
        activeStrategicMemoriesCount: activeMemories,
        diagnostics: {
          systemicExposure: propagationExposureScore,
          collapseProbability: prop.collapseProbability,
          ingestion: "relational_economic_command_center.generateCommandCenterSnapshot",
        } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });

    await this.prisma.relationalEconomicControlEvent.create({
      data: {
        snapshotId: row.id,
        eventType: "SNAPSHOT_CREATED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      },
    });

    await this.maybePublishRealtime(
      row.id,
      row.relationshipId,
      parties,
      severity as RelationalEconomicCommandCenterSeverityDto,
      globalRiskScore,
      "relational.command.snapshot_created",
    );

    await this.writeFollowOnEvents(row, parties, systemic, severity, globalRiskScore, input);

    return this.toSnapshotDto(row);
  }

  private async maybePublishRealtime(
    snapshotDbId: string,
    relationshipId: string | null,
    parties: CorridorParties,
    severity: RelationalEconomicCommandCenterSeverityDto,
    globalRiskScore: number,
    eventType: RelationalEconomicCommandCenterRealtimeEventType,
  ): Promise<void> {
    void this.realtime
      .publishBothSides({
        buyerOrganizationId: parties.buyerOrganizationId,
        sellerOrganizationId: parties.sellerOrganizationId,
        snapshotId: snapshotDbId,
        relationshipId,
        severity,
        globalRiskScore,
        realtimeEventType: eventType,
      })
      .catch((e) => this.log.warn(String(e)));
  }

  private async writeFollowOnEvents(
    row: {
      id: string;
      relationshipId: string | null;
      severity: string;
    },
    parties: CorridorParties,
    systemic: Awaited<ReturnType<RelationalEconomicSystemicViewService["buildSystemicView"]>>,
    severityScore: string,
    globalRiskScore: number,
    input: { actorOrganizationId: string; actorUserId: string },
  ): Promise<void> {
    if (!row.relationshipId) return;

    const clusterList = await this.clusters.buildOperationalClusters(row.relationshipId);
    if (clusterList.length) {
      await this.prisma.relationalEconomicControlEvent.create({
        data: {
          snapshotId: row.id,
          eventType: "SYSTEMIC_CLUSTER_DETECTED",
          actorOrganizationId: input.actorOrganizationId,
          actorUserId: input.actorUserId,
          diagnostics: { clusterCount: clusterList.length } as Prisma.InputJsonValue,
        },
      });
      await this.maybePublishRealtime(
        row.id,
        row.relationshipId,
        parties,
        severityScore as RelationalEconomicCommandCenterSeverityDto,
        globalRiskScore,
        "relational.command.cluster_detected",
      );
    }

    let propCascade = false;
    try {
      const pr = await this.propagation.detectPropagationRisk(row.relationshipId);
      propCascade =
        pr.propagationRisk === "HIGH" || pr.propagationRisk === "CRITICAL" || pr.propagationRisk === "CASCADE";
    } catch {
      propCascade = false;
    }
    if (propCascade) {
      await this.prisma.relationalEconomicControlEvent.create({
        data: {
          snapshotId: row.id,
          eventType: "CASCADE_RISK_DETECTED",
          actorOrganizationId: input.actorOrganizationId,
          actorUserId: input.actorUserId,
        },
      });
      await this.maybePublishRealtime(
        row.id,
        row.relationshipId,
        parties,
        severityScore as RelationalEconomicCommandCenterSeverityDto,
        globalRiskScore,
        "relational.command.cascade_detected",
      );
    }

    if (severityScore === "CRITICAL") {
      await this.prisma.relationalEconomicControlEvent.create({
        data: {
          snapshotId: row.id,
          eventType: "CRITICAL_CORRIDOR_DETECTED",
          actorOrganizationId: input.actorOrganizationId,
          actorUserId: input.actorUserId,
        },
      });
      await this.maybePublishRealtime(
        row.id,
        row.relationshipId,
        parties,
        severityScore as RelationalEconomicCommandCenterSeverityDto,
        globalRiskScore,
        "relational.command.critical_corridor_detected",
      );
    }

    if (systemic.propagationHeat >= 60) {
      await this.prisma.relationalEconomicControlEvent.create({
        data: {
          snapshotId: row.id,
          eventType: "STRATEGIC_PRESSURE_DETECTED",
          actorOrganizationId: input.actorOrganizationId,
          actorUserId: input.actorUserId,
        },
      });
      await this.maybePublishRealtime(
        row.id,
        row.relationshipId,
        parties,
        severityScore as RelationalEconomicCommandCenterSeverityDto,
        globalRiskScore,
        "relational.command.systemic_pressure_detected",
      );
    }

    await this.prisma.relationalEconomicControlEvent.create({
      data: {
        snapshotId: row.id,
        eventType: "COMMAND_VIEW_REFRESHED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      },
    });
  }

  async archiveSnapshot(input: {
    id: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
    organizationId: string;
  }): Promise<RelationalEconomicCommandCenterArchiveResponseDto> {
    const parsed = RelationalEconomicCommandCenterArchiveRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "command_center_archive_invalid" });

    const row = await this.prisma.relationalEconomicCommandCenterSnapshot.findFirst({
      where: {
        id: input.id,
        lifecycleStatus: "ACTIVE",
        relationshipId: { not: null },
        OR: [
          { snapshotCode: { startsWith: `NETWORK:${input.organizationId}:` } },
          {
            relationship: {
              OR: [
                { requesterOrganizationId: input.organizationId },
                { receiverOrganizationId: input.organizationId },
              ],
            },
          },
        ],
      },
    });
    if (!row?.relationshipId) {
      throw new NotFoundException({ code: "command_center_archive_not_found" });
    }

    const parties = await this.assertObservation(row.relationshipId);
    if (!this.commandPolicy.canMutateCommandSnapshot(parties.corridorState)) {
      throw new ForbiddenException({ code: "command_center_corridor_terminated" });
    }

    const meta =
      row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {};
    meta.archived = true;
    meta.archiveReason = parsed.data.archiveReason;

    await this.prisma.relationalEconomicCommandCenterSnapshot.update({
      where: { id: row.id },
      data: {
        lifecycleStatus: "ARCHIVED",
        metadata: meta as Prisma.InputJsonValue,
      },
    });

    const updated = await this.prisma.relationalEconomicCommandCenterSnapshot.findUniqueOrThrow({
      where: { id: row.id },
    });
    const snapshotDto = this.toSnapshotDto(updated);
    const res = RelationalEconomicCommandCenterArchiveResponseSchema.safeParse({
      snapshot: snapshotDto,
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!res.success) throw new BadRequestException({ code: "command_center_archive_response_invalid" });
    return res.data;
  }
}

