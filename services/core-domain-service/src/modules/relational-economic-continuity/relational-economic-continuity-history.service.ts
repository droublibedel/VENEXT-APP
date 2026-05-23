import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";

@Injectable()
export class RelationalEconomicContinuityHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicContinuityPolicyService,
  ) {}

  async buildResilienceHistory(relationshipId: string) {
    const snapshots = await this.prisma.relationalEconomicContinuitySnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 32,
      select: {
        snapshotCode: true,
        continuityScore: true,
        instabilityScore: true,
        recoveryProbability: true,
        systemicContinuityRisk: true,
        continuityStatus: true,
        createdAt: true,
      },
    });

    let trendDelta = 0;
    if (snapshots.length >= 2) {
      trendDelta = snapshots[0]!.continuityScore - snapshots[1]!.continuityScore;
    }

    return {
      snapshots: snapshots.map((s) => ({
        snapshotCode: s.snapshotCode,
        continuityScore: s.continuityScore,
        instabilityScore: s.instabilityScore,
        recoveryProbability: s.recoveryProbability,
        systemicContinuityRisk: s.systemicContinuityRisk,
        continuityStatus: s.continuityStatus,
        createdAt: s.createdAt.toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      trendDelta: this.policy.clampInt(trendDelta, -100, 100),
    };
  }
}
