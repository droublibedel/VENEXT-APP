import { createHash, randomUUID } from "node:crypto";

import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { RelationalSectorPressureLevel } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { MarketStructureVector } from "./relational-sector-market-structure.service";
import { RelationalSectorPolicyService } from "./relational-sector-policy.service";
import type { SectorPropagationPath } from "./relational-sector-propagation.service";
import { RelationalSectorRealtimeService } from "./relational-sector-realtime.service";

type StreamMeta = {
  revision?: number;
  fingerprint?: string;
  scoreFp?: string;
  propFp?: string;
  depFp?: string;
  msFp?: string;
};

/**
 * Instruction 20.24 — conditional sector realtime streaming (fingerprints, snapshot + deltas, idempotent keys).
 */
@Injectable()
export class RelationalSectorStreamingService {
  private readonly log = new Logger(RelationalSectorStreamingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalSectorPolicyService,
    private readonly realtime: RelationalSectorRealtimeService,
  ) {}

  private fp(parts: (string | number)[]): string {
    return createHash("sha256")
      .update(parts.join("|"))
      .digest("hex")
      .slice(0, 40);
  }

  async publishAfterIngestion(input: {
    relationshipId: string;
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    nodes: { id: string; sectorSlug: string }[];
    vector: MarketStructureVector;
    marketStructureType: string;
    operationalRisk: number;
    pressureLevel: RelationalSectorPressureLevel;
    cascadePaths: SectorPropagationPath[];
    maxDepthObserved: number;
    edgeCount: number;
    systemicExposureScore: number;
  }): Promise<{ fingerprintChanged: boolean }> {
    if (input.nodes.length === 0) return { fingerprintChanged: false };

    const primaryId = input.nodes[0]!.id;
    const row = await this.prisma.relationalSectorNode.findUnique({
      where: { id: primaryId },
      select: { metadata: true },
    });
    const prev = ((row?.metadata as Record<string, unknown> | null)?.stream ?? {}) as StreamMeta;

    const scoreFp = this.fp([input.operationalRisk, input.pressureLevel]);
    const propFp = this.fp([input.maxDepthObserved, input.cascadePaths.length]);
    const depFp = this.fp([input.edgeCount]);
    const msFp = this.fp([
      input.marketStructureType,
      input.vector.sectorConcentration,
      input.vector.corridorSaturation,
      input.vector.marketFragility,
    ]);
    const fingerprint = this.fp([
      scoreFp,
      propFp,
      depFp,
      msFp,
      input.vector.cumulativePressure,
      input.vector.oligopolyRisk,
    ]);

    if (prev.fingerprint === fingerprint) {
      return { fingerprintChanged: false };
    }

    const revision = (prev.revision ?? 0) + 1;
    const now = new Date().toISOString();
    const stream: StreamMeta = { revision, fingerprint, scoreFp, propFp, depFp, msFp };

    const baseMeta = (row?.metadata as Record<string, unknown> | null) ?? {};
    const metadata: Prisma.InputJsonValue = { ...baseMeta, stream } as Prisma.InputJsonValue;
    await this.prisma.relationalSectorNode.update({
      where: { id: primaryId },
      data: { metadata },
    });

    const common = {
      streamRevision: revision,
      fingerprint,
      relationshipId: input.relationshipId,
      computedAt: now,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };

    const snapshotBody = {
      ...common,
      eventId: randomUUID(),
      kind: "snapshot" as const,
      nodeCount: input.nodes.length,
      sectorSlugs: input.nodes.map((n) => n.sectorSlug).slice(0, 24),
      aggregateOperationalRisk: this.policy.clampInt(input.operationalRisk),
      marketStructureType: input.marketStructureType,
    };

    await this.realtime
      .publishStructuredCorridor({
        buyerOrganizationId: input.buyerOrganizationId,
        sellerOrganizationId: input.sellerOrganizationId,
        eventType: "relational.sector.snapshot.updated",
        body: snapshotBody,
      })
      .catch((e) => this.log.warn(String(e)));

    if (prev.scoreFp !== scoreFp) {
      await this.realtime
        .publishStructuredCorridor({
          buyerOrganizationId: input.buyerOrganizationId,
          sellerOrganizationId: input.sellerOrganizationId,
          eventType: "relational.sector.score.updated",
          body: {
            ...common,
            eventId: randomUUID(),
            kind: "delta" as const,
            sectorNodeId: input.nodes[0]!.id,
            operationalRiskScore: this.policy.clampInt(input.operationalRisk),
            pressureLevel: input.pressureLevel,
          },
        })
        .catch((e) => this.log.warn(String(e)));
    }

    if (prev.propFp !== propFp) {
      await this.realtime
        .publishStructuredCorridor({
          buyerOrganizationId: input.buyerOrganizationId,
          sellerOrganizationId: input.sellerOrganizationId,
          eventType: "relational.sector.propagation.updated",
          body: {
            ...common,
            eventId: randomUUID(),
            kind: "delta" as const,
            maxDepthObserved: input.maxDepthObserved,
            pathCount: input.cascadePaths.length,
            systemicExposureScore: this.policy.clampInt(input.systemicExposureScore),
          },
        })
        .catch((e) => this.log.warn(String(e)));
    }

    if (prev.depFp !== depFp) {
      await this.realtime
        .publishStructuredCorridor({
          buyerOrganizationId: input.buyerOrganizationId,
          sellerOrganizationId: input.sellerOrganizationId,
          eventType: "relational.sector.dependency.updated",
          body: {
            ...common,
            eventId: randomUUID(),
            kind: "delta" as const,
            edgeCount: input.edgeCount,
          },
        })
        .catch((e) => this.log.warn(String(e)));
    }

    if (prev.msFp !== msFp) {
      await this.realtime
        .publishStructuredCorridor({
          buyerOrganizationId: input.buyerOrganizationId,
          sellerOrganizationId: input.sellerOrganizationId,
          eventType: "relational.sector.marketStructure.updated",
          body: {
            ...common,
            eventId: randomUUID(),
            kind: "delta" as const,
            marketStructureType: input.marketStructureType,
            sectorConcentration: this.policy.clampInt(input.vector.sectorConcentration),
            corridorSaturation: this.policy.clampInt(input.vector.corridorSaturation),
            marketFragility: this.policy.clampInt(input.vector.marketFragility),
          },
        })
        .catch((e) => this.log.warn(String(e)));
    }

    return { fingerprintChanged: true };
  }
}
