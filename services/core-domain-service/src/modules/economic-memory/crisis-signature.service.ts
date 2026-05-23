import { Injectable } from "@nestjs/common";
import type { EconomicCrisisSignatureRow, EconomicPropagationBundle } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";

type Priority = EconomicCrisisSignatureRow["recommendedPriority"];

@Injectable()
export class CrisisSignatureService {
  constructor(private readonly prisma: PrismaService) {}

  /** Derive analytic signatures from current bundle — not absolute diagnoses. */
  deriveSignatures(bundle: EconomicPropagationBundle): Omit<EconomicCrisisSignatureRow, "id" | "createdAt">[] {
    const shocks = bundle.shocks;
    const types = new Set(shocks.map((s) => s.type));
    const topFrag = bundle.territoryFragility[0];
    const out: Omit<EconomicCrisisSignatureRow, "id" | "createdAt">[] = [];

    const liquidity = types.has("liquidity_collapse") || types.has("payment_instability");
    const supply = types.has("shipment_delayed") || types.has("supply_chain_stress") || types.has("distribution_fragility");
    const rel = types.has("relationship_fragmentation");
    const neg = types.has("negotiation_collapse");
    const territoryHot = types.has("territory_overheating");

    if (liquidity && topFrag && topFrag.fragilityScore > 0.35) {
      out.push({
        signatureCode: "liquidity_fragility_cluster",
        systemicRisk: bundle.overview.systemicRiskRollup,
        recurrenceProbability: Number(Math.min(1, 0.35 + topFrag.paymentExposure * 0.4).toFixed(3)),
        similarityIndex: Number(Math.min(1, topFrag.localTerritoryEvidence + 0.15).toFixed(3)),
        explanation:
          "Liquidity or payment shocks co-locate with elevated territory fragility — analytic cluster label for supervision sequencing.",
        affectedPoles: ["finance_collections", "order_adv", "data_intelligence"],
        recommendedPriority: "HIGH",
        territory: topFrag.territory,
      });
    }
    if (supply) {
      out.push({
        signatureCode: "supply_chain_destabilization",
        systemicRisk: Number(Math.min(1, bundle.overview.systemicRiskRollup * 0.95 + 0.05).toFixed(3)),
        recurrenceProbability: 0.42,
        similarityIndex: 0.48,
        explanation: "Shipment / execution stress signatures appear on the propagation lattice — prioritize hub truth before corridor promises.",
        affectedPoles: ["supply_logistics", "order_adv", "finance_collections"],
        recommendedPriority: "HIGH" as Priority,
        territory: topFrag?.territory,
      });
    }
    if (rel) {
      out.push({
        signatureCode: "distributor_fragmentation_wave",
        systemicRisk: bundle.overview.systemicRiskRollup * 0.85,
        recurrenceProbability: 0.38,
        similarityIndex: 0.44,
        explanation: "Commercial trust erosion pattern — correlates with activation efficiency loss in historical heuristics.",
        affectedPoles: ["commercial_network", "marketing_activation", "order_adv"],
        recommendedPriority: "MEDIUM",
        territory: topFrag?.territory,
      });
    }
    if (territoryHot && liquidity) {
      out.push({
        signatureCode: "territory_payment_collapse",
        systemicRisk: Number(Math.min(1, bundle.overview.systemicRiskRollup + 0.08).toFixed(3)),
        recurrenceProbability: 0.52,
        similarityIndex: 0.55,
        explanation: "Territory overheating with receivable heat — analytic coupling label for finance+territory supervision bursts.",
        affectedPoles: ["finance_collections", "supply_logistics", "strategic_intelligence"],
        recommendedPriority: "CRITICAL" as Priority,
        territory: topFrag?.territory,
      });
    }
    if (neg) {
      out.push({
        signatureCode: "negotiation_stress_pattern",
        systemicRisk: bundle.overview.systemicRiskRollup * 0.78,
        recurrenceProbability: 0.4,
        similarityIndex: 0.41,
        explanation: "ADV negotiation surface density risks revenue recognition drag — pattern label for deal discipline posture.",
        affectedPoles: ["order_adv", "finance_collections"],
        recommendedPriority: "MEDIUM" as Priority,
        territory: topFrag?.territory,
      });
    }
    if (rel && !liquidity) {
      out.push({
        signatureCode: "commercial_trust_erosion",
        systemicRisk: bundle.overview.systemicRiskRollup * 0.72,
        recurrenceProbability: 0.33,
        similarityIndex: 0.39,
        explanation: "Relationship fragmentation without acute liquidity tail — softer but recurring corridor risk envelope.",
        affectedPoles: ["commercial_network", "marketing_activation"],
        recommendedPriority: "LOW" as Priority,
        territory: topFrag?.territory,
      });
    }
    return out.slice(0, 8);
  }

  async persistFromBundle(bundle: EconomicPropagationBundle): Promise<void> {
    const derived = this.deriveSignatures(bundle);
    if (derived.length === 0) return;
    await this.prisma.$transaction(
      derived.map((d) =>
        this.prisma.economicCrisisSignature.create({
          data: {
            organizationId: bundle.organizationId,
            territory: d.territory ?? null,
            pole: d.affectedPoles[0] ?? null,
            signatureCode: d.signatureCode,
            severity: "MODERATE",
            confidence: 0.55,
            systemicRisk: d.systemicRisk,
            recurrenceProbability: d.recurrenceProbability,
            similarityIndex: d.similarityIndex,
            explanation: d.explanation,
            affectedPoles: d.affectedPoles,
            affectedTerritories: d.territory ? [d.territory] : [],
            recommendedPriority: d.recommendedPriority,
            sourceSignals: [`bundle.generatedAt:${bundle.generatedAt}`, `bundle.shockCount:${bundle.shocks.length}`],
            propagationDepth: bundle.chains[0]?.propagationDepth ?? null,
            metadata: { source: "EconomicPropagationBundle", version: bundle.version },
          },
        }),
      ),
    );
  }
}
