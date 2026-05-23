import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationalEconomicSovereigntyCalibrationService } from "./relational-economic-sovereignty-calibration.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";

@Injectable()
export class RelationalEconomicSovereigntyDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
    private readonly calibration: RelationalEconomicSovereigntyCalibrationService,
  ) {}

  private orgFilter(organizationId: string) {
    return {
      active: true,
      relationship: {
        OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
      },
    };
  }

  private corridorRef(n: {
    id: string;
    relationshipId: string;
    sovereigntyNodeCode: string;
    sovereigntyScore: number;
    autonomyScore: number;
    strategicCaptivityRisk: number;
    externalDependencyExposure: number;
    dependencyConcentration: number;
    systemicAutonomyRisk: number;
    severity: string;
    autonomyStatus: string;
    diagnostics: unknown;
  }) {
    const diag =
      n.diagnostics && typeof n.diagnostics === "object"
        ? (n.diagnostics as Record<string, unknown>)
        : {};
    const cal = this.calibration.getCalibration();
    return {
      sovereigntyNodeId: n.id,
      relationshipId: n.relationshipId,
      sovereigntyNodeCode: n.sovereigntyNodeCode,
      rawSovereigntyScore: n.sovereigntyScore,
      rawAutonomyScore: n.autonomyScore,
      calibratedSovereigntyScore: n.sovereigntyScore,
      calibratedAutonomyScore: n.autonomyScore,
      strategicCaptivityRisk: n.strategicCaptivityRisk,
      externalDependencyExposure: n.externalDependencyExposure,
      dependencyConcentration: n.dependencyConcentration,
      systemicAutonomyRisk: n.systemicAutonomyRisk,
      severity: n.severity,
      autonomyStatus: n.autonomyStatus,
      heuristicFallbackUsed: Boolean(diag.heuristicFallbackUsed),
      confidenceLevel: this.calibration.confidenceLevel({
        heuristicFallbackUsed: Boolean(diag.heuristicFallbackUsed),
        sourceCounts: Array.isArray(diag.computedFrom) ? (diag.computedFrom as unknown[]).length : 0,
        calibrationProfile: cal.profile,
      }),
      calibrationVersion: cal.calibrationVersion,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  async buildSovereigntyDashboard(organizationId: string) {
    const nodes = await this.prisma.relationalEconomicSovereigntyNode.findMany({
      where: this.orgFilter(organizationId),
      orderBy: [{ sovereigntyScore: "desc" }],
      take: 96,
      select: {
        id: true,
        relationshipId: true,
        sovereigntyNodeCode: true,
        sovereigntyScore: true,
        autonomyScore: true,
        strategicCaptivityRisk: true,
        externalDependencyExposure: true,
        dependencyConcentration: true,
        systemicAutonomyRisk: true,
        severity: true,
        autonomyStatus: true,
        diagnostics: true,
      },
    });

    const refs = nodes.map((n) => this.corridorRef(n));
    const cal = this.calibration.getCalibration();

    const avg = (field: keyof (typeof nodes)[0]) =>
      nodes.length === 0
        ? 0
        : this.policy.clampInt(
            nodes.reduce((s, n) => s + Number(n[field] ?? 0), 0) / nodes.length,
          );

    return {
      organizationId,
      corridorCount: nodes.length,
      aggregateSovereigntyScore: avg("sovereigntyScore"),
      aggregateAutonomyScore: avg("autonomyScore"),
      aggregateCaptivityRisk: avg("strategicCaptivityRisk"),
      aggregateExternalDependency: avg("externalDependencyExposure"),
      mostCaptiveCorridors: [...refs]
        .sort((a, b) => b.strategicCaptivityRisk - a.strategicCaptivityRisk)
        .slice(0, 12),
      mostAutonomousCorridors: [...refs]
        .sort((a, b) => b.calibratedAutonomyScore - a.calibratedAutonomyScore)
        .slice(0, 12),
      highExternalDependencyCorridors: [...refs]
        .sort((a, b) => b.externalDependencyExposure - a.externalDependencyExposure)
        .slice(0, 12),
      lowSovereigntyRiskCorridors: [...refs]
        .sort((a, b) => b.systemicAutonomyRisk - a.systemicAutonomyRisk)
        .slice(0, 12),
      calibrationVersion: cal.calibrationVersion,
      calibrationProfile: cal.profile,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  async buildSystemicCaptivity(organizationId: string) {
    const nodes = await this.prisma.relationalEconomicSovereigntyNode.findMany({
      where: {
        ...this.orgFilter(organizationId),
        strategicCaptivityRisk: { gte: this.calibration.getCalibration().captivityWeights.criticalThreshold },
      },
      orderBy: { strategicCaptivityRisk: "desc" },
      take: 48,
      select: {
        id: true,
        relationshipId: true,
        sovereigntyNodeCode: true,
        sovereigntyScore: true,
        autonomyScore: true,
        strategicCaptivityRisk: true,
        externalDependencyExposure: true,
        dependencyConcentration: true,
        systemicAutonomyRisk: true,
        severity: true,
        autonomyStatus: true,
        territoryCountry: true,
        sectorSlug: true,
        diagnostics: true,
      },
    });

    const byTerritory: Record<string, number> = {};
    const bySector: Record<string, number> = {};
    for (const n of nodes) {
      const t = n.territoryCountry || "unknown";
      byTerritory[t] = Math.max(byTerritory[t] ?? 0, n.strategicCaptivityRisk);
      const s = n.sectorSlug || "unspecified";
      bySector[s] = Math.max(bySector[s] ?? 0, n.strategicCaptivityRisk);
    }

    return {
      organizationId,
      captiveCorridors: nodes.map((n) => this.corridorRef(n)),
      captivityByTerritory: byTerritory,
      captivityBySector: bySector,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  async buildAutonomyDistribution(organizationId: string) {
    const nodes = await this.prisma.relationalEconomicSovereigntyNode.findMany({
      where: this.orgFilter(organizationId),
      take: 120,
      select: { autonomyScore: true, autonomyStatus: true, diagnostics: true },
    });

    const buckets = {
      "0-25": 0,
      "26-50": 0,
      "51-75": 0,
      "76-100": 0,
    } satisfies Record<string, number>;
    const byStatus: Record<string, number> = {};
    let fallbackCount = 0;

    for (const n of nodes) {
      const score = n.autonomyScore;
      if (score <= 25) buckets["0-25"] += 1;
      else if (score <= 50) buckets["26-50"] += 1;
      else if (score <= 75) buckets["51-75"] += 1;
      else buckets["76-100"] += 1;
      byStatus[n.autonomyStatus] = (byStatus[n.autonomyStatus] ?? 0) + 1;
      const diag =
        n.diagnostics && typeof n.diagnostics === "object"
          ? (n.diagnostics as Record<string, unknown>)
          : {};
      if (diag.heuristicFallbackUsed) fallbackCount += 1;
    }

    const cal = this.calibration.getCalibration();
    return {
      organizationId,
      sampleSize: nodes.length,
      autonomyBuckets: buckets,
      autonomyByStatus: byStatus,
      heuristicFallbackCorridors: fallbackCount,
      calibrationVersion: cal.calibrationVersion,
      calibrationProfile: cal.profile,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  async buildDependencyConcentration(organizationId: string) {
    const nodes = await this.prisma.relationalEconomicSovereigntyNode.findMany({
      where: this.orgFilter(organizationId),
      take: 120,
      select: {
        dependencyConcentration: true,
        externalDependencyExposure: true,
        territoryCountry: true,
        sectorSlug: true,
      },
    });

    const byTerritory: Record<string, number> = {};
    const bySector: Record<string, number> = {};
    let totalConc = 0;
    let totalExt = 0;

    for (const n of nodes) {
      totalConc += n.dependencyConcentration;
      totalExt += n.externalDependencyExposure;
      const t = n.territoryCountry || "unknown";
      byTerritory[t] = Math.max(byTerritory[t] ?? 0, n.externalDependencyExposure);
      const s = n.sectorSlug || "unspecified";
      bySector[s] = Math.max(bySector[s] ?? 0, n.externalDependencyExposure);
    }

    const n = nodes.length || 1;
    return {
      organizationId,
      sampleSize: nodes.length,
      meanDependencyConcentration: this.policy.clampInt(totalConc / n),
      meanExternalDependencyExposure: this.policy.clampInt(totalExt / n),
      systemicExposureByTerritory: byTerritory,
      systemicExposureBySector: bySector,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }
}
