import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalEconomicDependencyExposure } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";
import { RelationalEconomicSovereigntyRealtimeService } from "./relational-economic-sovereignty-realtime.service";

export type SovereigntyEdgeEnrichmentDiagnostics = {
  peerCandidatesCount: number;
  peerScannedCount: number;
  edgesCreated: number;
  edgesUpdated: number;
  boundedScanApplied: boolean;
  edgeSourcesUsed: string[];
};

@Injectable()
export class RelationalEconomicSovereigntyEdgeEnrichmentService {
  private readonly log = new Logger(RelationalEconomicSovereigntyEdgeEnrichmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly realtime: RelationalEconomicSovereigntyRealtimeService,
  ) {}

  async enrichSovereigntyEdgesForRelationship(
    relationshipId: string,
    buyerOrganizationId: string,
    sellerOrganizationId: string,
  ): Promise<SovereigntyEdgeEnrichmentDiagnostics> {
    const empty: SovereigntyEdgeEnrichmentDiagnostics = {
      peerCandidatesCount: 0,
      peerScannedCount: 0,
      edgesCreated: 0,
      edgesUpdated: 0,
      boundedScanApplied: false,
      edgeSourcesUsed: [],
    };

    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { corridorState: true },
    });
    if (!rel) return empty;

    const mutationGate = this.policy.assertEconomicSovereigntyMutationAllowed(rel.corridorState);
    if (!mutationGate.allowed) return empty;

    const primary = await this.prisma.relationalEconomicSovereigntyNode.findFirst({
      where: {
        relationshipId,
        active: true,
        sovereigntyNodeCode: { contains: "PRIMARY_AUTONOMY" },
      },
      select: {
        id: true,
        sectorSlug: true,
        territoryCountry: true,
        geoZoneId: true,
        dependencyConcentration: true,
        strategicCaptivityRisk: true,
        corridorSelfRecoveryProbability: true,
      },
    });
    if (!primary) return empty;

    const scanLimit = this.policy.edgeScanLimit();
    const maxDepth = this.policy.edgeMaxDepth();
    const edgeSourcesUsed = new Set<string>();

    const peerCandidates = await this.prisma.relationship.findMany({
      where: {
        id: { not: relationshipId },
        OR: [
          { requesterOrganizationId: buyerOrganizationId },
          { receiverOrganizationId: buyerOrganizationId },
          { requesterOrganizationId: sellerOrganizationId },
          { receiverOrganizationId: sellerOrganizationId },
        ],
      },
      select: { id: true },
      take: scanLimit * 2,
    });

    let peerScannedCount = 0;
    let edgesCreated = 0;
    let edgesUpdated = 0;
    let boundedScanApplied = peerCandidates.length > scanLimit;

    const sectorPeers =
      primary.sectorSlug != null
        ? await this.prisma.relationalEconomicSovereigntyNode.findMany({
            where: {
              active: true,
              sectorSlug: primary.sectorSlug,
              relationshipId: { not: relationshipId },
              relationship: {
                OR: [
                  { requesterOrganizationId: buyerOrganizationId },
                  { receiverOrganizationId: buyerOrganizationId },
                  { requesterOrganizationId: sellerOrganizationId },
                  { receiverOrganizationId: sellerOrganizationId },
                ],
              },
            },
            select: { id: true, relationshipId: true, strategicCaptivityRisk: true, dependencyConcentration: true },
            take: scanLimit,
          })
        : [];

    if (sectorPeers.length > 0) edgeSourcesUsed.add("shared_sector");

    const geoPeers = await this.prisma.relationalEconomicSovereigntyNode.findMany({
      where: {
        active: true,
        territoryCountry: primary.territoryCountry,
        relationshipId: { not: relationshipId },
        relationship: {
          OR: [
            { requesterOrganizationId: buyerOrganizationId },
            { receiverOrganizationId: buyerOrganizationId },
            { requesterOrganizationId: sellerOrganizationId },
            { receiverOrganizationId: sellerOrganizationId },
          ],
        },
      },
      select: { id: true, relationshipId: true, strategicCaptivityRisk: true, dependencyConcentration: true },
      take: Math.max(0, scanLimit - sectorPeers.length),
    });
    if (geoPeers.length > 0) edgeSourcesUsed.add("shared_geo");

    const [macroCross, supplyCross, continuityCross, memoryCount, pressureCount] = await Promise.all([
      this.prisma.relationalMacroEconomicDependency.count({
        where: { sourceNode: { relationshipId } },
      }),
      this.prisma.relationalSupplyFlowEdge.count({
        where: { sourceFlow: { relationshipId } },
      }),
      this.prisma.relationalEconomicContinuityDependency.count({
        where: { sourceNode: { relationshipId } },
      }),
      this.prisma.relationalStrategicMemory.count({
        where: { relationshipId, memoryStatus: "ACTIVE" },
      }),
      this.prisma.relationalEconomicDependencyEdge.count({
        where: {
          OR: [
            { sourceNode: { relationshipId } },
            { targetNode: { relationshipId } },
          ],
        },
      }),
    ]);

    if (macroCross > 0) edgeSourcesUsed.add("macro_dependencies");
    if (supplyCross > 0) edgeSourcesUsed.add("supply_flow_edges");
    if (continuityCross > 0) edgeSourcesUsed.add("continuity_dependencies");
    if (memoryCount > 0) edgeSourcesUsed.add("strategic_memory_patterns");
    if (pressureCount > 0) edgeSourcesUsed.add("pressure_graph");

    const peerNodes = new Map<string, { id: string; relationshipId: string; risk: number; conc: number }>();
    for (const p of [...sectorPeers, ...geoPeers]) {
      if (peerNodes.size >= scanLimit) {
        boundedScanApplied = true;
        break;
      }
      peerNodes.set(p.id, {
        id: p.id,
        relationshipId: p.relationshipId,
        risk: p.strategicCaptivityRisk,
        conc: p.dependencyConcentration,
      });
    }

    for (const cand of peerCandidates) {
      if (peerNodes.size >= scanLimit) break;
      const node = await this.prisma.relationalEconomicSovereigntyNode.findFirst({
        where: { relationshipId: cand.id, active: true },
        select: { id: true, relationshipId: true, strategicCaptivityRisk: true, dependencyConcentration: true },
      });
      if (node) {
        peerNodes.set(node.id, {
          id: node.id,
          relationshipId: node.relationshipId,
          risk: node.strategicCaptivityRisk,
          conc: node.dependencyConcentration,
        });
        edgeSourcesUsed.add("org_shared_corridor");
      }
    }

    peerScannedCount = peerNodes.size;

    for (const peer of peerNodes.values()) {
      if (peerScannedCount > scanLimit) boundedScanApplied = true;
      const depthPenalty = Math.min(maxDepth, 4);
      const concentration = this.policy.clampInt(
        (primary.dependencyConcentration + peer.conc) / 2 + depthPenalty,
      );
      const captivityTransfer = this.policy.clampInt(
        (primary.strategicCaptivityRisk + peer.risk) / 2 + depthPenalty * 2,
      );
      const recoveryProb = this.policy.clampProb(
        (primary.corridorSelfRecoveryProbability +
          (100 - peer.risk) / 200) /
          1.1,
      );

      const existing = await this.prisma.relationalEconomicSovereigntyDependency.findFirst({
        where: {
          OR: [
            { sourceSovereigntyNodeId: primary.id, targetSovereigntyNodeId: peer.id },
            { sourceSovereigntyNodeId: peer.id, targetSovereigntyNodeId: primary.id },
          ],
        },
      });

      const exposureLevel =
        concentration >= 72
          ? RelationalEconomicDependencyExposure.SYSTEMIC
          : concentration >= 55
            ? RelationalEconomicDependencyExposure.CRITICAL
            : RelationalEconomicDependencyExposure.ELEVATED;

      const data = {
        exposureLevel,
        dependencyConcentration: concentration,
        captivityTransferScore: captivityTransfer,
        autonomyRecoveryProbability: recoveryProb,
        diagnostics: {
          edgeKind: "multi_corridor_enrichment",
          peerRelationshipId: peer.relationshipId,
          edgeSourcesUsed: Array.from(edgeSourcesUsed),
          boundedScanApplied,
        } as Prisma.InputJsonValue,
        metadata: {
          enrichmentVersion: "20.28",
          peerRelationshipId: peer.relationshipId,
        } as Prisma.InputJsonValue,
      };

      if (existing) {
        await this.prisma.relationalEconomicSovereigntyDependency.update({
          where: { id: existing.id },
          data,
        });
        edgesUpdated += 1;
      } else {
        await this.prisma.relationalEconomicSovereigntyDependency.create({
          data: {
            sourceSovereigntyNodeId: primary.id,
            targetSovereigntyNodeId: peer.id,
            ...data,
          },
        });
        edgesCreated += 1;
      }
    }

    const diagnostics: SovereigntyEdgeEnrichmentDiagnostics = {
      peerCandidatesCount: peerCandidates.length,
      peerScannedCount,
      edgesCreated,
      edgesUpdated,
      boundedScanApplied,
      edgeSourcesUsed: Array.from(edgeSourcesUsed),
    };

    if (edgesCreated > 0 || edgesUpdated > 0) {
      await this.realtime
        .publishToOrganizations({
          buyerOrganizationId,
          sellerOrganizationId,
          relationshipId,
          sovereigntyNodeId: primary.id,
          sovereigntyNodeCode: null,
          intensity: edgesCreated + edgesUpdated,
          autonomyDepth: maxDepth,
          eventType: "relational.sovereignty.edge_enriched",
        })
        .catch((e) => this.log.warn(String(e)));
    }

    return diagnostics;
  }
}
