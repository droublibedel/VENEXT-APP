import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalEconomicAutonomyStatus,
  RelationalEconomicSovereigntySeverity,
  RelationalEconomicSovereigntySignalType,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";
import { RelationalEconomicSovereigntyRealtimeService } from "./relational-economic-sovereignty-realtime.service";

export type SovereigntyRetentionDiagnostics = {
  retentionApplied: boolean;
  archivedSnapshotsCount: number;
  preservedCriticalSnapshotsCount: number;
  retentionPolicy: string;
  retentionReason: string;
};

@Injectable()
export class RelationalEconomicSovereigntyRetentionService {
  private readonly log = new Logger(RelationalEconomicSovereigntyRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly realtime: RelationalEconomicSovereigntyRealtimeService,
  ) {}

  computeRetentionDiagnostics(partial: Partial<SovereigntyRetentionDiagnostics>): SovereigntyRetentionDiagnostics {
    return {
      retentionApplied: partial.retentionApplied ?? false,
      archivedSnapshotsCount: partial.archivedSnapshotsCount ?? 0,
      preservedCriticalSnapshotsCount: partial.preservedCriticalSnapshotsCount ?? 0,
      retentionPolicy: partial.retentionPolicy ?? this.policy.retentionPolicyLabel(),
      retentionReason: partial.retentionReason ?? "none",
    };
  }

  async isSnapshotCritical(snapshotId: string): Promise<boolean> {
    const snap = await this.prisma.relationalEconomicSovereigntySnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        sovereigntyNode: { select: { severity: true, autonomyStatus: true } },
        relationship: {
          select: {
            relationalEconomicSovereigntySignals: {
              where: {
                signalType: {
                  in: [
                    RelationalEconomicSovereigntySignalType.SYSTEMIC_EXPOSURE,
                    RelationalEconomicSovereigntySignalType.CAPTIVITY_RISK,
                    RelationalEconomicSovereigntySignalType.RECOVERY_AUTONOMY,
                  ],
                },
              },
              take: 8,
              select: { signalType: true, severity: true, signalScore: true },
            },
          },
        },
      },
    });
    if (!snap) return false;

    const node = snap.sovereigntyNode;
    if (
      node?.severity === RelationalEconomicSovereigntySeverity.CRITICAL ||
      node?.severity === RelationalEconomicSovereigntySeverity.HIGH
    ) {
      return true;
    }
    if (
      node?.autonomyStatus === RelationalEconomicAutonomyStatus.CRITICAL ||
      node?.autonomyStatus === RelationalEconomicAutonomyStatus.CAPTIVE
    ) {
      return true;
    }
    if (snap.dependencyExposureScore >= 78 || snap.sovereigntyScore <= 28) {
      return true;
    }

    const signals = snap.relationship.relationalEconomicSovereigntySignals;
    for (const s of signals) {
      if (
        s.signalType === RelationalEconomicSovereigntySignalType.SYSTEMIC_EXPOSURE ||
        s.signalType === RelationalEconomicSovereigntySignalType.CAPTIVITY_RISK
      ) {
        return true;
      }
      if (
        s.signalType === RelationalEconomicSovereigntySignalType.RECOVERY_AUTONOMY &&
        s.signalScore <= 35
      ) {
        return true;
      }
    }

    const diag =
      snap.diagnostics && typeof snap.diagnostics === "object"
        ? (snap.diagnostics as Record<string, unknown>)
        : {};
    const recoveryProb = diag.corridorSelfRecoveryProbability;
    if (typeof recoveryProb === "number" && recoveryProb < 0.3) {
      return true;
    }

    return false;
  }

  async preserveCriticalSnapshots(relationshipId: string): Promise<number> {
    if (!this.policy.preserveCriticalSnapshots()) return 0;
    const critical = await this.prisma.relationalEconomicSovereigntySnapshot.findMany({
      where: { relationshipId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: this.policy.maxSnapshotsPerCorridor() * 3,
      select: { id: true },
    });
    let preserved = 0;
    for (const row of critical) {
      if (!(await this.isSnapshotCritical(row.id))) continue;
      await this.prisma.relationalEconomicSovereigntySnapshot.update({
        where: { id: row.id },
        data: {
          metadata: {
            retentionPreserved: true,
            preservedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
      preserved += 1;
    }
    return preserved;
  }

  async archiveOldSnapshotsForRelationship(
    relationshipId: string,
  ): Promise<{ archived: number; preserved: number }> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { corridorState: true, requesterOrganizationId: true, receiverOrganizationId: true },
    });
    if (!rel) return { archived: 0, preserved: 0 };

    const mutationGate = this.policy.assertEconomicSovereigntyMutationAllowed(rel.corridorState);
    if (!mutationGate.allowed) {
      this.log.warn(JSON.stringify({ relationshipId, phase: "retention_skipped", ...mutationGate.diagnostics }));
      return { archived: 0, preserved: 0 };
    }

    const maxKeep = this.policy.maxSnapshotsPerCorridor();
    const retentionDays = this.policy.retentionDays();
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000);

    const snapshots = await this.prisma.relationalEconomicSovereigntySnapshot.findMany({
      where: { relationshipId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });

    let archived = 0;
    let preserved = 0;

    for (let i = 0; i < snapshots.length; i++) {
      const snap = snapshots[i]!;
      const exceedsCount = i >= maxKeep;
      const exceedsAge = snap.createdAt < cutoff;
      if (!exceedsCount && !exceedsAge) continue;

      if (this.policy.preserveCriticalSnapshots() && (await this.isSnapshotCritical(snap.id))) {
        preserved += 1;
        continue;
      }

      await this.prisma.relationalEconomicSovereigntySnapshot.update({
        where: { id: snap.id },
        data: {
          archivedAt: new Date(),
          metadata: { retentionArchived: true, archivedBy: "applySnapshotRetention" } as Prisma.InputJsonValue,
        },
      });
      archived += 1;
    }

    return { archived, preserved };
  }

  async applySnapshotRetention(
    relationshipId: string,
    _latestSnapshotId?: string,
  ): Promise<SovereigntyRetentionDiagnostics> {
    try {
      await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    } catch {
      return this.computeRetentionDiagnostics({
        retentionApplied: false,
        retentionReason: "corridor_observation_denied",
      });
    }

    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: {
        corridorState: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
      },
    });
    if (!rel) {
      return this.computeRetentionDiagnostics({ retentionReason: "relationship_not_found" });
    }

    const mutationGate = this.policy.assertEconomicSovereigntyMutationAllowed(rel.corridorState);
    if (!mutationGate.allowed) {
      return this.computeRetentionDiagnostics({
        retentionApplied: false,
        retentionReason: mutationGate.diagnostics.mutationSkippedReason ?? "mutation_blocked",
      });
    }

    const preservedCritical = await this.preserveCriticalSnapshots(relationshipId);
    const { archived, preserved } = await this.archiveOldSnapshotsForRelationship(relationshipId);

    const diagnostics = this.computeRetentionDiagnostics({
      retentionApplied: archived > 0 || preservedCritical > 0,
      archivedSnapshotsCount: archived,
      preservedCriticalSnapshotsCount: preservedCritical + preserved,
      retentionReason: archived > 0 ? "max_snapshots_or_age_exceeded" : "within_retention_window",
    });

    if (archived > 0) {
      await this.realtime
        .publishToOrganizations({
          buyerOrganizationId: rel.requesterOrganizationId,
          sellerOrganizationId: rel.receiverOrganizationId,
          relationshipId,
          sovereigntyNodeId: null,
          sovereigntyNodeCode: null,
          intensity: archived,
          autonomyDepth: 0,
          eventType: "relational.sovereignty.retention_applied",
        })
        .catch((e) => this.log.warn(String(e)));
    }

    return diagnostics;
  }
}
