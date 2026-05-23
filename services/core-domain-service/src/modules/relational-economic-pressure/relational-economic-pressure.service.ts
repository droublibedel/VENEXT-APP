/**
 * Instruction 20.21 — pressure overview & read APIs (deterministic, bounded).
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  CriticalCorridorSchema,
  DependencyEdgeSchema,
  DependencyMapSchema,
  DependencyNodeSchema,
  FragilityZonesSchema,
  PressureOverviewSchema,
  PropagationMapSchema,
  type CriticalCorridorDto,
  type DependencyEdgeDto,
  type DependencyMapDto,
  type FragilityZonesDto,
  type PressureOverviewDto,
  type PropagationMapDto,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicContagionService } from "./relational-economic-contagion.service";
import { RelationalEconomicDependencyService } from "./relational-economic-dependency.service";
import { RelationalEconomicFragilityService } from "./relational-economic-fragility.service";
import { RelationalEconomicPressurePolicyService } from "./relational-economic-pressure-policy.service";

@Injectable()
export class RelationalEconomicPressureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicPressurePolicyService,
    private readonly dependency: RelationalEconomicDependencyService,
    private readonly contagion: RelationalEconomicContagionService,
    private readonly fragility: RelationalEconomicFragilityService,
  ) {}

  private async assertObservation(relationshipId: string): Promise<void> {
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
  }

  private async assertOrgOnRelationship(organizationId: string, relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findFirst({
      where: {
        id: relationshipId,
        OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
      },
      select: { id: true },
    });
    if (!rel) throw new NotFoundException({ code: "economic_pressure_relationship_not_found" });
  }

  private dtoNode(row: {
    id: string;
    relationshipId: string;
    nodeCode: string;
    dependencyScore: number;
    pressureScore: number;
    fragilityScore: number;
    propagationExposureScore: number;
    dependencyDensity: number;
    criticalityLevel: string;
    systemicWeight: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const dto = {
      id: row.id,
      relationshipId: row.relationshipId,
      nodeCode: row.nodeCode,
      dependencyScore: row.dependencyScore,
      pressureScore: row.pressureScore,
      fragilityScore: row.fragilityScore,
      propagationExposureScore: row.propagationExposureScore,
      dependencyDensity: row.dependencyDensity,
      criticalityLevel: row.criticalityLevel,
      systemicWeight: row.systemicWeight,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = DependencyNodeSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "economic_pressure_node_contract_invalid" });
    return p.data;
  }

  private dtoEdge(row: {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    dependencyType: string;
    dependencyWeight: number;
    propagationProbability: number;
    asymmetricDependency: boolean;
    pressureContribution: number;
    status: string;
  }): DependencyEdgeDto {
    const dto = {
      id: row.id,
      sourceNodeId: row.sourceNodeId,
      targetNodeId: row.targetNodeId,
      dependencyType: row.dependencyType,
      dependencyWeight: row.dependencyWeight,
      propagationProbability: row.propagationProbability,
      asymmetricDependency: row.asymmetricDependency,
      pressureContribution: row.pressureContribution,
      status: row.status,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = DependencyEdgeSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "economic_pressure_edge_contract_invalid" });
    return p.data;
  }

  async computePressureOverview(organizationId: string, relationshipId: string): Promise<PressureOverviewDto> {
    await this.assertObservation(relationshipId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);

    const m = await this.dependency.computeNodeMetrics(relationshipId);
    const peerIds = await this.dependency.detectDependencyRelationships(relationshipId);

    const saturationPressure = this.policy.clampInt((m.dependencyScore + m.pressureScore) / 2);
    const coordinationPressure = this.policy.clampInt(m.systemicWeight * 0.85 + m.dependencyDensity * 0.25);
    const incidentPressure = this.policy.clampInt(m.fragilityScore);
    const orchestrationPressure = this.policy.clampInt(m.dependencyScore);
    const propagationPressure = this.policy.clampInt(m.propagationExposureScore);
    const dependencyPressure = this.policy.clampInt(m.dependencyScore + m.dependencyDensity / 2);
    const systemicPressure = this.policy.clampInt(
      (saturationPressure +
        coordinationPressure +
        incidentPressure +
        orchestrationPressure +
        propagationPressure +
        dependencyPressure) /
        6,
    );

    const criticalCorridors: CriticalCorridorDto[] = [];
    if (m.criticalityLevel === "HIGH" || m.criticalityLevel === "CRITICAL" || systemicPressure >= 70) {
      const cc = CriticalCorridorSchema.safeParse({
        relationshipId,
        pressureScore: m.pressureScore,
        severity: m.criticalityLevel,
        collapseExposure: Math.min(1, systemicPressure / 100 + m.fragilityScore / 250),
        paymentExecutionDisabled: true,
        publicTrackingDisabled: true,
      });
      if (cc.success) criticalCorridors.push(cc.data);
    }

    const pressureZones = peerIds.slice(0, 12).map((id) => `PEER_CORRIDOR:${id.slice(0, 8)}`);
    const concentrationAlerts: string[] = [];
    if (peerIds.length >= 6) concentrationAlerts.push("STRUCTURAL_MULTI_PEER_CONCENTRATION");
    if (m.dependencyDensity >= 55) concentrationAlerts.push("HIGH_DEPENDENCY_DENSITY");

    const dependencyWarnings: string[] = [];
    if (m.criticalityLevel === "MEDIUM" || m.criticalityLevel === "HIGH") {
      dependencyWarnings.push("ASYMMETRIC_PRESSURE_POSSIBLE");
    }

    const focalNode = await this.prisma.relationalEconomicDependencyNode.findUnique({
      where: { relationshipId },
      select: { id: true },
    });
    let propagationChains: string[][] = [];
    if (focalNode) {
      const edges = await this.prisma.relationalEconomicDependencyEdge.findMany({
        where: { status: "ACTIVE", OR: [{ sourceNodeId: focalNode.id }, { targetNodeId: focalNode.id }] },
        select: {
          sourceNodeId: true,
          targetNodeId: true,
          pressureContribution: true,
          propagationProbability: true,
        },
        take: 120,
      });
      const map = this.contagion.buildPressurePropagationMap({
        startNodeId: focalNode.id,
        edges: edges.map((e) => ({
          sourceNodeId: e.sourceNodeId,
          targetNodeId: e.targetNodeId,
          pressureContribution: e.pressureContribution,
          propagationProbability: e.propagationProbability,
        })),
      });
      const relByNode = new Map<string, string>();
      const nodes = await this.prisma.relationalEconomicDependencyNode.findMany({
        where: { id: { in: [...new Set(edges.flatMap((e) => [e.sourceNodeId, e.targetNodeId]))] } },
        select: { id: true, relationshipId: true },
      });
      for (const n of nodes) relByNode.set(n.id, n.relationshipId);
      propagationChains = map.paths
        .map((p) => p.map((nid) => relByNode.get(nid) ?? nid).filter((x) => x.length === 36))
        .slice(0, 20);
    }

    const payload = {
      relationshipId,
      saturationPressure,
      coordinationPressure,
      incidentPressure,
      orchestrationPressure,
      propagationPressure,
      dependencyPressure,
      systemicPressure,
      criticalCorridors,
      pressureZones,
      collapseExposure: Math.min(1, systemicPressure / 100 + m.fragilityScore / 200),
      concentrationAlerts,
      dependencyWarnings,
      propagationChains,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const parsed = PressureOverviewSchema.safeParse(payload);
    if (!parsed.success) throw new BadRequestException({ code: "economic_pressure_overview_invalid" });
    return parsed.data;
  }

  async getDependencyMap(organizationId: string, relationshipId: string): Promise<DependencyMapDto> {
    await this.assertObservation(relationshipId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);

    const focal = await this.prisma.relationalEconomicDependencyNode.findUnique({ where: { relationshipId } });
    if (!focal) {
      const empty = DependencyMapSchema.safeParse({
        relationshipId,
        nodes: [],
        edges: [],
        paymentExecutionDisabled: true,
        publicTrackingDisabled: true,
      });
      if (!empty.success) throw new BadRequestException({ code: "economic_pressure_map_invalid" });
      return empty.data;
    }

    const edges = await this.prisma.relationalEconomicDependencyEdge.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ sourceNodeId: focal.id }, { targetNodeId: focal.id }],
      },
      take: 120,
    });
    const nodeIds = new Set<string>([focal.id]);
    for (const e of edges) {
      nodeIds.add(e.sourceNodeId);
      nodeIds.add(e.targetNodeId);
    }
    const nodes = await this.prisma.relationalEconomicDependencyNode.findMany({
      where: { id: { in: [...nodeIds] } },
    });

    const payload = {
      relationshipId,
      nodes: nodes.map((n) => this.dtoNode(n)),
      edges: edges.map((e) => this.dtoEdge(e)),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = DependencyMapSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "economic_pressure_map_invalid" });
    return p.data;
  }

  async getPropagationMap(organizationId: string, relationshipId: string): Promise<PropagationMapDto> {
    await this.assertObservation(relationshipId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    const focal = await this.prisma.relationalEconomicDependencyNode.findUnique({ where: { relationshipId } });
    if (!focal) {
      const empty = PropagationMapSchema.safeParse({
        relationshipId,
        intensity: 0,
        paths: [],
        paymentExecutionDisabled: true,
        publicTrackingDisabled: true,
      });
      if (!empty.success) throw new BadRequestException({ code: "economic_pressure_propagation_invalid" });
      return empty.data;
    }
    const edges = await this.prisma.relationalEconomicDependencyEdge.findMany({
      where: { status: "ACTIVE", OR: [{ sourceNodeId: focal.id }, { targetNodeId: focal.id }] },
      select: {
        sourceNodeId: true,
        targetNodeId: true,
        pressureContribution: true,
        propagationProbability: true,
      },
      take: 120,
    });
    const map = this.contagion.buildPressurePropagationMap({
      startNodeId: focal.id,
      edges: edges.map((e) => ({
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        pressureContribution: e.pressureContribution,
        propagationProbability: e.propagationProbability,
      })),
    });
    const relByNode = new Map<string, string>();
    const nodes = await this.prisma.relationalEconomicDependencyNode.findMany({
      where: { id: { in: [...new Set(edges.flatMap((e) => [e.sourceNodeId, e.targetNodeId]))] } },
      select: { id: true, relationshipId: true },
    });
    for (const n of nodes) relByNode.set(n.id, n.relationshipId);
    const paths = map.paths
      .map((p) => ({
        path: p.map((nid) => relByNode.get(nid) ?? nid).filter((rid) => rid.length === 36).slice(0, 16),
        score: this.policy.clampInt(map.intensity),
      }))
      .filter((x) => x.path.length > 1)
      .slice(0, 40);

    const payload = {
      relationshipId,
      intensity: map.intensity,
      paths,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = PropagationMapSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "economic_pressure_propagation_invalid" });
    return p.data;
  }

  async getCriticalCorridors(organizationId: string): Promise<{ corridors: CriticalCorridorDto[] }> {
    const rows = await this.prisma.relationalEconomicDependencyNode.findMany({
      where: {
        OR: [
          { relationship: { requesterOrganizationId: organizationId } },
          { relationship: { receiverOrganizationId: organizationId } },
        ],
        criticalityLevel: { in: ["HIGH", "CRITICAL"] },
      },
      take: 40,
      orderBy: { pressureScore: "desc" },
    });
    const corridors: CriticalCorridorDto[] = [];
    for (const r of rows) {
      const cc = CriticalCorridorSchema.safeParse({
        relationshipId: r.relationshipId,
        pressureScore: r.pressureScore,
        severity: r.criticalityLevel,
        collapseExposure: Math.min(1, r.pressureScore / 100 + r.fragilityScore / 220),
        paymentExecutionDisabled: true,
        publicTrackingDisabled: true,
      });
      if (cc.success) corridors.push(cc.data);
    }
    return { corridors };
  }

  async getFragilityZones(organizationId: string): Promise<FragilityZonesDto> {
    const nodes = await this.prisma.relationalEconomicDependencyNode.findMany({
      where: {
        OR: [
          { relationship: { requesterOrganizationId: organizationId } },
          { relationship: { receiverOrganizationId: organizationId } },
        ],
      },
      take: 80,
    });
    const inputs = await Promise.all(
      nodes.map(async (n) => {
        const peers = await this.dependency.detectDependencyRelationships(n.relationshipId);
        return {
          relationshipId: n.relationshipId,
          fragilityScore: n.fragilityScore,
          dependencyDensity: n.dependencyDensity,
          systemicWeight: n.systemicWeight,
          peerCount: peers.length,
        };
      }),
    );
    const zones = this.fragility.detectFragilityZones(inputs);
    const payload = {
      zones: zones.map((z) => ({
        zoneCode: z.zoneCode,
        corridorCount: z.corridorCount,
        fragilityScore: z.fragilityScore,
        narrative: z.narrative,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = FragilityZonesSchema.safeParse(payload);
    if (!p.success) throw new BadRequestException({ code: "economic_pressure_fragility_invalid" });
    return p.data;
  }

  async archiveDependencyEdge(input: {
    organizationId: string;
    edgeId: string;
    actorOrganizationId: string;
    actorUserId: string;
    archiveReason: string;
  }): Promise<DependencyEdgeDto> {
    const edge = await this.prisma.relationalEconomicDependencyEdge.findUnique({
      where: { id: input.edgeId },
      include: { sourceNode: true, targetNode: true },
    });
    if (!edge) throw new NotFoundException({ code: "economic_pressure_edge_not_found" });

    const relIds = [edge.sourceNode.relationshipId, edge.targetNode.relationshipId];
    for (const rid of relIds) {
      await this.assertObservation(rid);
      await this.assertOrgOnRelationship(input.organizationId, rid);
      const state = await this.prisma.relationship.findUnique({
        where: { id: rid },
        select: { corridorState: true },
      });
      if (!state || !this.policy.canMutateEconomicPressureGraph(state.corridorState)) {
        throw new ForbiddenException({ code: "economic_pressure_corridor_terminated" });
      }
    }

    const meta = (edge.metadata && typeof edge.metadata === "object" ? edge.metadata : {}) as Record<string, unknown>;
    meta.archived = true;
    meta.archiveReason = input.archiveReason;

    const updated = await this.prisma.relationalEconomicDependencyEdge.update({
      where: { id: edge.id },
      data: {
        status: "ARCHIVED",
        metadata: meta as Prisma.InputJsonValue,
      },
    });

    await this.prisma.relationalEconomicPressureEvent.create({
      data: {
        relationshipId: edge.sourceNode.relationshipId,
        edgeId: edge.id,
        eventType: "DEPENDENCY_ARCHIVED",
        actorOrganizationId: input.actorOrganizationId,
        actorUserId: input.actorUserId,
        diagnostics: { archiveReason: input.archiveReason } as Prisma.InputJsonValue,
      },
    });

    return this.dtoEdge(updated);
  }
}
