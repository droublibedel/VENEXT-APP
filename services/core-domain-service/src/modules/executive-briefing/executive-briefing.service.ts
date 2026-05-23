import { Injectable } from "@nestjs/common";
import type { ExecutiveBriefingResponse } from "@venext/shared-contracts";
import { RelationshipStatus } from "@prisma/client";
import { BackofficeAiGatewayService } from "../backoffice/backoffice-ai-gateway.service";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { MarketPressureService } from "../market-pressure/market-pressure.service";
import { StrategicRiskService } from "../strategic-risk/strategic-risk.service";
import { StrategicSignalsRadarService } from "../strategic-intelligence/strategic-signals-radar.service";

@Injectable()
export class ExecutiveBriefingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly pressure: MarketPressureService,
    private readonly risk: StrategicRiskService,
    private readonly radar: StrategicSignalsRadarService,
    private readonly aiGateway: BackofficeAiGatewayService,
  ) {}

  async briefing(organizationId: string): Promise<ExecutiveBriefingResponse> {
    if (!(await this.flags.isEnabled("strategic_ai_enabled", { organizationId }))) {
      return {
        provider: "MockAIProvider",
        policy: "DISABLED",
        title: "Strategic briefing disabled",
        executiveSummary: "Strategic AI narrative disabled by policy.",
        anomalies: [],
        opportunities: [],
        recommendedActions: [],
        confidence: 0,
        dataSources: ["policy:strategic_ai_enabled=false"],
        headline: "Strategic AI narrative disabled by policy.",
        sections: [],
        note: "Enable strategic_ai_enabled to activate MockAIProvider gateway briefing.",
      };
    }

    const [pressureSnap, riskSnap, radarSnap, sigDensity, relStable] = await Promise.all([
      this.pressure.snapshot(organizationId),
      this.risk.matrix(organizationId),
      this.radar.radar(organizationId),
      this.prisma.economicSignal.count({
        where: { organizationId, createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } },
      }),
      this.prisma.relationship.count({
        where: {
          OR: [
            { requesterOrganizationId: organizationId },
            { receiverOrganizationId: organizationId },
          ],
          status: RelationshipStatus.ACCEPTED,
        },
      }),
    ]);

    const topRisk = riskSnap.risks[0];
    const topCorr = radarSnap.correlation[0];

    return this.aiGateway.generateExecutiveStrategicBriefing({
      pressureBand: String(pressureSnap.band ?? "LOW"),
      pressureHeadline: pressureSnap.headline ?? "Industrial posture stable.",
      impactedRegions: pressureSnap.impactedRegions ?? [],
      impactedCategories: pressureSnap.impactedProductCategories ?? [],
      anomalyThesis: topCorr?.thesis,
      topRiskLine: topRisk ? `${topRisk.riskType}: ${topRisk.estimatedImpact}` : undefined,
      acceptedRelationshipCount: relStable,
      signalDensity7d: sigDensity,
      dataSources: [
        "economic_signals",
        "relationships",
        "market_pressure",
        "risk_matrix",
        "signal_radar",
        "mock_ai_gateway",
      ],
    });
  }
}
