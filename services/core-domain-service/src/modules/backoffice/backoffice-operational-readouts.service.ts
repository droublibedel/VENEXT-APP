import { Injectable } from "@nestjs/common";
import { OrgMemberPole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";

const POLE_SLUGS: { pole: OrgMemberPole; label: string }[] = [
  { pole: OrgMemberPole.DIRECTION_STRATEGY, label: "Direction / Strategy" },
  { pole: OrgMemberPole.COMMERCIAL_NETWORK, label: "Commercial / Network" },
  { pole: OrgMemberPole.MARKETING_ACTIVATION, label: "Marketing / Activation" },
  { pole: OrgMemberPole.ORDERS_ADV, label: "Orders / ADV" },
  { pole: OrgMemberPole.SUPPLY_LOGISTICS, label: "Supply / Logistics" },
  { pole: OrgMemberPole.FINANCE_COLLECTIONS, label: "Finance / Collections" },
  { pole: OrgMemberPole.DATA_INTELLIGENCE, label: "Data / Intelligence" },
  { pole: OrgMemberPole.INDUSTRIAL_SAFETY, label: "Industrial Safety" },
];

@Injectable()
export class BackofficeOperationalReadoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly canonical: CanonicalFeatureFlagEvaluator,
  ) {}

  async paymentsSnapshot(organizationId?: string, regionCode?: string) {
    const keys = [
      "wallet_enabled",
      "payments_enabled",
      "qr_enabled",
      "nfc_enabled",
      "provider_orange_enabled",
      "provider_wave_enabled",
      "provider_mtn_enabled",
      "transfer_enabled",
      "electronic_payment_enabled",
    ] as const;
    const evaluated: Record<string, Awaited<ReturnType<CanonicalFeatureFlagEvaluator["evaluate"]>>> = {};
    const snapshot: Record<string, boolean> = {};
    for (const k of keys) {
      const ev = await this.canonical.evaluate(k, { organizationId, region: regionCode, country: regionCode });
      evaluated[k] = ev;
      snapshot[k] = ev.enabled;
    }
    const recentTx = await this.prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        status: true,
        provider: true,
        type: true,
        amount: true,
        currency: true,
        createdAt: true,
        organizationId: true,
      },
    });
    return {
      evaluated,
      effectiveSnapshot: snapshot,
      recentTransactions: recentTx,
      transactionMockStatus: "MOCK_LEDGER_ACTIVE",
    };
  }

  async safetySnapshot() {
    const flag = await this.canonical.evaluate("industrial_safety_enabled", {});
    const recalls = await this.prisma.recallEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { product: { select: { id: true, name: true, organizationId: true } } },
    });
    return {
      industrialSafetyFlag: flag,
      connectorStatus: "MOCK_CONNECTOR",
      futureApiConnector: "BLOC_POMPIER_PLACEHOLDER",
      lastSafetySignals: recalls.map((r) => ({
        id: r.id,
        severity: r.severity,
        productId: r.productId,
        createdAt: r.createdAt,
        productName: r.product.name,
      })),
      activeIndustrialIncidents: recalls.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH").length,
    };
  }

  async industrialPolesGovernance() {
    const polesEnabled = await this.canonical.evaluate("industrial_poles_enabled", {});
    const rows = await this.prisma.industrialPoleConfig.findMany({
      take: 200,
      orderBy: { updatedAt: "desc" },
      include: {
        organization: { select: { id: true, displayName: true, commercialId: true } },
      },
    });
    const byPole = POLE_SLUGS.map(({ pole, label }) => {
      const subset = rows.filter((r) => r.pole === pole);
      const enabledCount = subset.filter((r) => r.enabled).length;
      return {
        pole,
        label,
        configs: subset.length,
        enabledCount,
        riskState: enabledCount === 0 ? "DORMANT" : enabledCount < subset.length / 2 ? "PARTIAL" : "ACTIVE",
      };
    });
    return {
      platformFlag: polesEnabled,
      poles: byPole,
      rawConfigsSample: rows.slice(0, 40),
    };
  }
}
