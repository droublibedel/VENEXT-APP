import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma, RelationalEconomicSignalEventType } from "@prisma/client";
import type { RelationalEconomicSignalRealtimeEventType } from "@venext/shared-contracts";
import {
  RelationalEconomicClusterListSchema,
  RelationalEconomicGraphDiagnosticsSchema,
  RelationalEconomicGraphOverviewSchema,
  type RelationalEconomicGraphDiagnosticsDto,
  RelationalEconomicPropagationSchema,
  RelationalEconomicSignalActionResponseSchema,
  RelationalEconomicSignalArchiveRequestSchema,
  RelationalEconomicSignalEdgeSchema,
  RelationalEconomicSignalListSchema,
  RelationalEconomicSignalNodeSchema,
  type RelationalEconomicClusterListDto,
  type RelationalEconomicGraphOverviewDto,
  type RelationalEconomicPropagationDto,
  type RelationalEconomicSignalActionResponseDto,
  type RelationalEconomicSignalListDto,
  type RelationalEconomicSignalNodeDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicClusterService } from "./relational-economic-cluster.service";
import { RelationalEconomicCorrelationService } from "./relational-economic-correlation.service";
import { RelationalEconomicPropagationService } from "./relational-economic-propagation.service";
import { RelationalEconomicSignalPolicyService } from "./relational-economic-signal-policy.service";
import { slicePeersForBoundedScan, type PeerScanDiagnostics } from "./relational-economic-peer-scan";
import { RelationalEconomicSignalRealtimeService } from "./relational-economic-signal-realtime.service";

const SYSTEM_ACTOR_USER_ID = "00000000-0000-4000-8000-000000000097";

type NodeRow = {
  id: string;
  relationshipId: string | null;
  nodeCode: string;
  nodeType: import("@prisma/client").RelationalEconomicSignalNodeType;
  severity: import("@prisma/client").RelationalEconomicSignalSeverity;
  propagationRisk: import("@prisma/client").RelationalEconomicPropagationRisk;
  dependencyScore: number;
  corridorInfluenceScore: number;
  operationalFragilityScore: number;
  systemicExposureScore: number;
  observedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: unknown;
};

@Injectable()
export class RelationalEconomicSignalGraphService {
  private readonly log = new Logger(RelationalEconomicSignalGraphService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicSignalPolicyService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly correlation: RelationalEconomicCorrelationService,
    private readonly propagation: RelationalEconomicPropagationService,
    private readonly clusters: RelationalEconomicClusterService,
    private readonly realtime: RelationalEconomicSignalRealtimeService,
  ) {}

  private isArchived(meta: unknown): boolean {
    return Boolean(meta && typeof meta === "object" && (meta as { archived?: boolean }).archived);
  }

  private buildNodeDiagnostics(
    snap: Awaited<ReturnType<RelationalEconomicCorrelationService["gatherStressSnapshot"]>>,
    peerScan?: PeerScanDiagnostics,
  ): Prisma.InputJsonValue {
    return { snap, peerScan } as Prisma.InputJsonValue;
  }

  private extractGraphDiagnostics(raw: unknown): RelationalEconomicGraphDiagnosticsDto | undefined {
    if (!raw || typeof raw !== "object") return undefined;
    const root = raw as { snap?: Record<string, unknown>; peerScan?: Record<string, unknown> };
    const snap = root.snap;
    const peerScan = root.peerScan;
    const payload = {
      openTasksComputed: snap?.openTasksComputed === true ? true : undefined,
      openTasksSource: typeof snap?.openTasksSource === "string" ? snap.openTasksSource : undefined,
      openTasksIncludedStatuses: Array.isArray(snap?.openTasksIncludedStatuses)
        ? (snap.openTasksIncludedStatuses as string[])
        : undefined,
      openTasksExcludedStatuses: Array.isArray(snap?.openTasksExcludedStatuses)
        ? (snap.openTasksExcludedStatuses as string[])
        : undefined,
      peerScanLimit: typeof peerScan?.peerScanLimit === "number" ? peerScan.peerScanLimit : undefined,
      peerScanLimitApplied:
        typeof peerScan?.peerScanLimitApplied === "boolean" ? peerScan.peerScanLimitApplied : undefined,
      peerCandidatesCount:
        typeof peerScan?.peerCandidatesCount === "number" ? peerScan.peerCandidatesCount : undefined,
      peerScannedCount: typeof peerScan?.peerScannedCount === "number" ? peerScan.peerScannedCount : undefined,
      peerScanCompletenessRatio:
        typeof peerScan?.peerScanCompletenessRatio === "number" ? peerScan.peerScanCompletenessRatio : undefined,
      peerScanMode: typeof peerScan?.peerScanMode === "string" ? peerScan.peerScanMode : undefined,
      warnings: Array.isArray(peerScan?.warnings) ? (peerScan.warnings as string[]) : undefined,
    };
    const parsed = RelationalEconomicGraphDiagnosticsSchema.safeParse(payload);
    return parsed.success ? parsed.data : undefined;
  }

  private toNodeDto(row: NodeRow, events: { id: string; nodeId: string | null; edgeId: string | null; eventType: import("@prisma/client").RelationalEconomicSignalEventType; actorOrganizationId: string; actorUserId: string; createdAt: Date }[]): RelationalEconomicSignalNodeDto {
    const dto = {
      id: row.id,
      relationshipId: row.relationshipId,
      nodeCode: row.nodeCode,
      nodeType: row.nodeType,
      severity: row.severity,
      propagationRisk: row.propagationRisk,
      dependencyScore: row.dependencyScore,
      corridorInfluenceScore: row.corridorInfluenceScore,
      operationalFragilityScore: row.operationalFragilityScore,
      systemicExposureScore: row.systemicExposureScore,
      observedAt: row.observedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      events: events.map((e) => ({
        id: e.id,
        nodeId: e.nodeId,
        edgeId: e.edgeId,
        eventType: e.eventType,
        actorOrganizationId: e.actorOrganizationId,
        actorUserId: e.actorUserId,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
        createdAt: e.createdAt.toISOString(),
      })),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicSignalNodeSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "economic_signal_node_contract_invalid" });
    return p.data;
  }

  async assertObservationAllowed(relationshipId: string) {
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
        requesterOrganizationId: rel.requesterOrganizationId,
        receiverOrganizationId: rel.receiverOrganizationId,
      };
    }
    return {
      buyerOrganizationId: rel.requesterOrganizationId,
      sellerOrganizationId: rel.receiverOrganizationId,
      corridorState: rel.corridorState,
      requesterOrganizationId: rel.requesterOrganizationId,
      receiverOrganizationId: rel.receiverOrganizationId,
    };
  }

  async upsertCorridorNode(
    relationshipId: string,
    peerScanDiagnostics?: PeerScanDiagnostics,
  ): Promise<RelationalEconomicSignalNodeDto> {
    const parties = await this.assertObservationAllowed(relationshipId);
    if (!this.policy.canMutateGraph(parties.corridorState)) {
      throw new ForbiddenException({ code: "economic_signal_corridor_terminated" });
    }

    const snap = await this.correlation.gatherStressSnapshot(relationshipId);
    const stress = this.policy.computeStressScore(snap);
    const severity = this.policy.severityFromScore(stress);
    const nodeCode = `CORRIDOR:${relationshipId}`;

    const edgeCount = await this.prisma.relationalEconomicSignalEdge.count({
      where: {
        OR: [
          { sourceNode: { relationshipId } },
          { targetNode: { relationshipId } },
        ],
      },
    });

    const propagationRisk = this.policy.propagationRiskFromScore(stress, edgeCount);
    const systemicExposure = Math.min(100, stress + edgeCount * 3);

    const node = await this.prisma.relationalEconomicSignalNode.upsert({
      where: { nodeCode },
      create: {
        relationshipId,
        nodeCode,
        nodeType: "CORRIDOR",
        severity,
        propagationRisk,
        dependencyScore: stress,
        corridorInfluenceScore: Math.min(100, stress + 5),
        operationalFragilityScore: Math.min(
          100,
          snap.openIncidents * 10 + snap.slaAlerts * 8 + snap.openTasks * 3,
        ),
        systemicExposureScore: systemicExposure,
        diagnostics: this.buildNodeDiagnostics(snap, peerScanDiagnostics),
        metadata: {} as Prisma.InputJsonValue,
      },
      update: {
        severity,
        propagationRisk,
        dependencyScore: stress,
        corridorInfluenceScore: Math.min(100, stress + 5),
        operationalFragilityScore: Math.min(
          100,
          snap.openIncidents * 10 + snap.slaAlerts * 8 + snap.openTasks * 3,
        ),
        systemicExposureScore: systemicExposure,
        observedAt: new Date(),
        diagnostics: this.buildNodeDiagnostics(snap, peerScanDiagnostics),
      },
    });

    await this.prisma.relationalEconomicSignalEvent.create({
      data: {
        nodeId: node.id,
        eventType: "SIGNAL_CREATED",
        actorOrganizationId: parties.buyerOrganizationId,
        actorUserId: SYSTEM_ACTOR_USER_ID,
      },
    });

    const events = await this.prisma.relationalEconomicSignalEvent.findMany({
      where: { nodeId: node.id },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    const dto = this.toNodeDto(node as NodeRow, events);
    await this.publish(parties, dto, "relational.economic.signal_created");
    return dto;
  }

  async syncGraphForRelationship(relationshipId: string): Promise<void> {
    const parties = await this.assertObservationAllowed(relationshipId);
    if (!this.policy.canMutateGraph(parties.corridorState)) return;

    const peerWhere = {
      id: { not: relationshipId },
      OR: [
        { requesterOrganizationId: parties.requesterOrganizationId },
        { receiverOrganizationId: parties.requesterOrganizationId },
        { requesterOrganizationId: parties.receiverOrganizationId },
        { receiverOrganizationId: parties.receiverOrganizationId },
      ],
      corridorState: { not: "TERMINATED" as const },
    };
    const peerCandidates = await this.prisma.relationship.findMany({
      where: peerWhere,
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    const { peers: peerRelationships, diagnostics: peerScanDiagnostics } =
      slicePeersForBoundedScan(peerCandidates);

    const anchor = await this.upsertCorridorNode(relationshipId, peerScanDiagnostics);

    for (const peer of peerRelationships) {
      const corr = await this.correlation.detectOperationalCorrelation(relationshipId, peer.id);
      if (!corr) continue;

      const peerNode = await this.upsertCorridorNode(peer.id, undefined);
      const strength = this.policy.correlationStrengthFromScore(corr.correlationScore);

      const edge = await this.prisma.relationalEconomicSignalEdge.upsert({
        where: {
          sourceNodeId_targetNodeId_dependencyType: {
            sourceNodeId: anchor.id,
            targetNodeId: peerNode.id,
            dependencyType: "SYSTEMIC",
          },
        },
        create: {
          sourceNodeId: anchor.id,
          targetNodeId: peerNode.id,
          dependencyType: "SYSTEMIC",
          correlationStrength: strength,
          propagationProbability: corr.propagationProbability,
          sharedIncidentCount: corr.sharedIncidentCount,
          sharedOperationalStress: corr.sharedOperationalStress,
          diagnostics: { correlationScore: corr.correlationScore } as Prisma.InputJsonValue,
        },
        update: {
          correlationStrength: strength,
          propagationProbability: corr.propagationProbability,
          sharedIncidentCount: corr.sharedIncidentCount,
          sharedOperationalStress: corr.sharedOperationalStress,
        },
      });

      await this.prisma.relationalEconomicSignalEvent.create({
        data: {
          edgeId: edge.id,
          eventType: "SIGNAL_CORRELATED",
          actorOrganizationId: parties.buyerOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
        },
      });
      await this.publish(parties, anchor, "relational.economic.signal_correlated");
    }

    const prop = await this.propagation.detectPropagationRisk(relationshipId);
    if (prop.propagationRisk === "HIGH" || prop.propagationRisk === "CRITICAL" || prop.propagationRisk === "CASCADE") {
      await this.prisma.relationalEconomicSignalEvent.create({
        data: {
          nodeId: anchor.id,
          eventType: "PROPAGATION_DETECTED",
          actorOrganizationId: parties.buyerOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
          diagnostics: prop.diagnostics as Prisma.InputJsonValue,
        },
      });
      await this.publish(parties, anchor, "relational.economic.propagation_detected");
    }
    if (prop.exposureScore >= 75) {
      await this.prisma.relationalEconomicSignalEvent.create({
        data: {
          nodeId: anchor.id,
          eventType: "SYSTEMIC_RISK_DETECTED",
          actorOrganizationId: parties.buyerOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
        },
      });
      await this.publish(parties, anchor, "relational.economic.systemic_risk_detected");
    }

    const built = await this.clusters.buildOperationalClusters(relationshipId);
    for (const c of built) {
      await this.prisma.relationalEconomicSignalEvent.create({
        data: {
          nodeId: anchor.id,
          eventType: "CLUSTER_CREATED",
          actorOrganizationId: parties.buyerOrganizationId,
          actorUserId: SYSTEM_ACTOR_USER_ID,
          metadata: c as unknown as Prisma.InputJsonValue,
        },
      });
      await this.realtime.publishBothSides({
        buyerOrganizationId: parties.buyerOrganizationId,
        sellerOrganizationId: parties.sellerOrganizationId,
        nodeId: anchor.id,
        relationshipId,
        propagationRisk: anchor.propagationRisk,
        systemicExposureScore: anchor.systemicExposureScore,
        clusterSize: c.corridorCount,
        realtimeEventType: "relational.economic.cluster_detected",
      });
    }
  }

  async listSignals(input: { relationshipId?: string }): Promise<RelationalEconomicSignalListDto> {
    const nodeWhere: Prisma.RelationalEconomicSignalNodeWhereInput = {};
    if (input.relationshipId) nodeWhere.relationshipId = input.relationshipId;

    const nodes = await this.prisma.relationalEconomicSignalNode.findMany({
      where: nodeWhere,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    const activeNodes = nodes.filter((n) => !this.isArchived(n.metadata));

    const nodeIds = activeNodes.map((n) => n.id);
    const edges = await this.prisma.relationalEconomicSignalEdge.findMany({
      where: {
        OR: [{ sourceNodeId: { in: nodeIds } }, { targetNodeId: { in: nodeIds } }],
      },
      take: 200,
    });

    const signals: RelationalEconomicSignalNodeDto[] = [];
    for (const row of activeNodes) {
      const events = await this.prisma.relationalEconomicSignalEvent.findMany({
        where: { nodeId: row.id },
        orderBy: { createdAt: "asc" },
        take: 50,
      });
      signals.push(this.toNodeDto(row as NodeRow, events));
    }

    const edgeDtos = edges.map((e) => {
      const dto = {
        id: e.id,
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        dependencyType: e.dependencyType,
        correlationStrength: e.correlationStrength,
        propagationProbability: e.propagationProbability,
        sharedIncidentCount: e.sharedIncidentCount,
        sharedOperationalStress: e.sharedOperationalStress,
        createdAt: e.createdAt.toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalEconomicSignalEdgeSchema.safeParse(dto);
      if (!p.success) throw new BadRequestException({ code: "economic_signal_edge_contract_invalid" });
      return p.data;
    });

    const payload = {
      signals,
      edges: edgeDtos,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicSignalListSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "economic_signal_list_invalid" });
    return p.data;
  }

  async buildGraphOverview(relationshipId: string): Promise<RelationalEconomicGraphOverviewDto> {
    await this.assertObservationAllowed(relationshipId);
    const list = await this.listSignals({ relationshipId });
    const clusters = await this.getClusters(relationshipId);
    const maxRisk = list.signals.reduce<import("@prisma/client").RelationalEconomicPropagationRisk>(
      (acc, s) => {
        const order = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "CASCADE"];
        return order.indexOf(s.propagationRisk) > order.indexOf(acc) ? s.propagationRisk : acc;
      },
      "LOW",
    );
    const avgDep =
      list.signals.length > 0
        ? list.signals.reduce((s, n) => s + n.dependencyScore, 0) / list.signals.length
        : 0;
    const exposure = list.signals.length
      ? Math.max(...list.signals.map((s) => s.systemicExposureScore))
      : 0;

    const corridorNode = await this.prisma.relationalEconomicSignalNode.findFirst({
      where: { relationshipId, nodeType: "CORRIDOR" },
      select: { diagnostics: true },
    });
    const diagnostics = this.extractGraphDiagnostics(corridorNode?.diagnostics);

    const payload = {
      relationshipId,
      nodeCount: list.signals.length,
      edgeCount: list.edges.length,
      averageDependencyScore: avgDep,
      maxPropagationRisk: maxRisk,
      systemicExposureScore: exposure,
      clusterCount: clusters.clusters.length,
      computedAt: new Date().toISOString(),
      diagnostics,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicGraphOverviewSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "economic_graph_overview_invalid" });
    return p.data;
  }

  async getPropagation(relationshipId: string): Promise<RelationalEconomicPropagationDto> {
    await this.assertObservationAllowed(relationshipId);
    const prop = await this.propagation.projectCascadeCollapse(relationshipId);
    const payload = {
      relationshipId,
      propagationRisk: prop.propagationRisk,
      cascadeDepth: prop.cascadeDepth,
      exposureScore: prop.exposureScore,
      affectedNodeIds: prop.affectedNodeIds,
      collapseProbability: prop.collapseProbability,
      diagnostics: prop.diagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicPropagationSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "economic_propagation_invalid" });
    return p.data;
  }

  async getClusters(relationshipId?: string): Promise<RelationalEconomicClusterListDto> {
    if (relationshipId) await this.assertObservationAllowed(relationshipId);
    const built = await this.clusters.buildOperationalClusters(relationshipId);
    const payload = {
      clusters: built.map((c) => ({
        ...c,
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicClusterListSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "economic_clusters_invalid" });
    return p.data;
  }

  async archiveSignal(input: {
    nodeId: string;
    body: unknown;
    actorOrganizationId: string;
    actorUserId: string;
  }): Promise<RelationalEconomicSignalActionResponseDto> {
    const parsed = RelationalEconomicSignalArchiveRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "economic_signal_archive_invalid" });

    const node = await this.prisma.relationalEconomicSignalNode.findUnique({ where: { id: input.nodeId } });
    if (!node) throw new NotFoundException({ code: "economic_signal_not_found" });
    if (node.relationshipId) {
      const parties = await this.assertObservationAllowed(node.relationshipId);
      if (!this.policy.canMutateGraph(parties.corridorState)) {
        throw new ForbiddenException({ code: "economic_signal_corridor_terminated" });
      }
    }

    const meta = (node.metadata && typeof node.metadata === "object" ? node.metadata : {}) as Record<string, unknown>;
    meta.archived = true;
    meta.archiveReason = parsed.data.archiveReason;
    meta.archivedAt = new Date().toISOString();

    await this.prisma.relationalEconomicSignalNode.update({
      where: { id: input.nodeId },
      data: { metadata: meta as Prisma.InputJsonValue },
    });

    await this.prisma.relationalEconomicSignalEvent.create({
      data: {
        nodeId: input.nodeId,
        eventType: "SIGNAL_ARCHIVED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
      },
    });

    const events = await this.prisma.relationalEconomicSignalEvent.findMany({
      where: { nodeId: input.nodeId },
      take: 50,
    });
    const dto = this.toNodeDto(node as NodeRow, events);
    if (node.relationshipId) {
      const parties = await this.assertObservationAllowed(node.relationshipId);
      await this.publish(parties, dto, "relational.economic.signal_archived", "SIGNAL_ARCHIVED");
    }
    const payload = { signal: dto, paymentExecutionDisabled: true as const, publicTrackingDisabled: true as const };
    const p = RelationalEconomicSignalActionResponseSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "economic_signal_action_invalid" });
    return p.data;
  }

  private async publish(
    parties: { buyerOrganizationId: string; sellerOrganizationId: string },
    node: RelationalEconomicSignalNodeDto,
    realtimeEventType: RelationalEconomicSignalRealtimeEventType,
    journalEventType?: RelationalEconomicSignalEventType,
  ): Promise<void> {
    void this.realtime
      .publishBothSides({
        buyerOrganizationId: parties.buyerOrganizationId,
        sellerOrganizationId: parties.sellerOrganizationId,
        nodeId: node.id,
        relationshipId: node.relationshipId,
        propagationRisk: node.propagationRisk,
        systemicExposureScore: node.systemicExposureScore,
        journalEventType,
        realtimeEventType,
      })
      .catch((e) => this.log.warn(String(e)));
  }
}
