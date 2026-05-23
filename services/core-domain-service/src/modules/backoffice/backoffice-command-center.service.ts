import { Injectable } from "@nestjs/common";
import { FeatureFlagScopeType, RelationshipStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { BackofficeDataQualityService } from "../backoffice-data-quality/backoffice-data-quality.service";
import { BackofficeAiGatewayService } from "./backoffice-ai-gateway.service";
import { BACKOFFICE_GOVERNED_FLAG_KEYS, FLAG_AFFECTED_MODULES } from "./governance-keys";

@Injectable()
export class BackofficeCommandCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly canonical: CanonicalFeatureFlagEvaluator,
    private readonly dataQuality: BackofficeDataQualityService,
    private readonly ai: BackofficeAiGatewayService,
  ) {}

  async overview() {
    const since = new Date(Date.now() - 24 * 3600_000);
    const [
      activeOrganizations,
      governanceSuspendedOrgs,
      acceptedRelationships,
      pendingRelationships,
      blockedRelationships,
      suspendedRelationships,
      enabledGlobalFlags,
      economicSignals24h,
      activeInjections,
      audit24h,
      dq,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { governanceSuspended: false } }),
      this.prisma.organization.count({ where: { governanceSuspended: true } }),
      this.prisma.relationship.count({ where: { status: RelationshipStatus.ACCEPTED } }),
      this.prisma.relationship.count({ where: { status: RelationshipStatus.PENDING } }),
      this.prisma.relationship.count({ where: { status: RelationshipStatus.BLOCKED } }),
      this.prisma.relationship.count({ where: { status: RelationshipStatus.SUSPENDED } }),
      this.prisma.featureFlag.count({
        where: { enabled: true, scopeType: FeatureFlagScopeType.GLOBAL, scopeValue: "" },
      }),
      this.prisma.economicSignal.count({ where: { createdAt: { gte: since } } }),
      this.prisma.sponsoredProductInjection.count({ where: { active: true } }),
      this.prisma.backofficeAuditLog.count({ where: { createdAt: { gte: since } } }),
      this.dataQuality.runScan(),
    ]);

    const moduleSurface: Record<string, Awaited<ReturnType<CanonicalFeatureFlagEvaluator["evaluate"]>>> = {};
    for (const k of BACKOFFICE_GOVERNED_FLAG_KEYS.slice(0, 12)) {
      moduleSurface[k] = await this.canonical.evaluate(k, {});
    }

    const aiSnap = this.ai.getSnapshot();
    const warnings = dq.findings.filter((f) => f.severity !== "LOW").map((f) => f.code);

    return {
      meta: {
        nodeEnv: process.env.NODE_ENV ?? "development",
        devAuthBypassActive: process.env.DEV_AUTH_BYPASS === "true" || process.env.DEV_AUTH_BYPASS === "1",
      },
      networkVitality: {
        activeOrganizations,
        governanceSuspendedOrgs,
        relationshipExpansion: {
          accepted: acceptedRelationships,
          pending: pendingRelationships,
          blocked: blockedRelationships,
          suspended: suspendedRelationships,
        },
      },
      signalIntegrity: {
        economicSignalsLast24h: economicSignals24h,
        dataQualityHighSeverity: dq.summary.high,
        dataQualityCodes: warnings,
      },
      featureSurfaceStatus: {
        globalEnabledFlagRows: enabledGlobalFlags,
        canonicalSamples: moduleSurface,
        affectedModuleMap: FLAG_AFFECTED_MODULES,
      },
      economicSignalFlow: {
        windowHours: 24,
        count: economicSignals24h,
      },
      moduleRiskState: {
        highFindings: dq.summary.high,
        totalFindings: dq.summary.totalFindings,
      },
      sponsoredVisibility: { activeInjections },
      realtimeChannelState: {
        demo: ["demo.realtime.economic_signals", "demo.operational.signal.batch"],
        live: ["live.economic.signal", "live.relationship.event", "live.catalog.visibility.changed"],
      },
      aiMockStatus: {
        provider: aiSnap.activeProvider,
        poleInsightGeneration: aiSnap.poleInsightGeneration,
        confidenceAverage: aiSnap.confidenceAverage,
        failedCalls: aiSnap.failedInsightCalls,
      },
      governance: {
        auditEventsLast24h: audit24h,
      },
      systemHealth: {
        status: dq.summary.high > 0 ? "DEGRADED" : "OK",
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
