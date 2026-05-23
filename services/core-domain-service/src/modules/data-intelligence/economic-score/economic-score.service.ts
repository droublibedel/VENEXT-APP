import { Injectable } from "@nestjs/common";
import { PaymentStatus, RelationshipStatus, ShipmentStatus } from "@prisma/client";
import type { EconomicScoreResponse } from "@venext/shared-contracts";
import { territoryNormalizedCodeFromOrg } from "../../supply-logistics-intelligence/territory-code-normalizer";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

@Injectable()
export class EconomicScoreService {
  build(s: DataIntelligenceCrossCutSnapshot, enabled: boolean): EconomicScoreResponse {
    const empty = (explanation: string): EconomicScoreResponse => ({
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "DISABLED",
      organizationEconomicScore: { score: 0, explanation, sources: [] },
      territoryEconomicScore: { score: 0, explanation, sources: [] },
      networkResilienceScore: { score: 0, explanation, sources: [] },
      liquidityStressScore: { score: 0, explanation, sources: [] },
      fulfillmentReliabilityScore: { score: 0, explanation, sources: [] },
      relationshipTrustScore: { score: 0, explanation, sources: [] },
    });

    if (!enabled) return empty("Data intelligence disabled.");

    const unpaidR =
      s.finance.orders.length > 0
        ? s.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID).length / s.finance.orders.length
        : 0;
    const shipOk =
      s.supply.shipments.length > 0
        ? s.supply.shipments.filter((sh) => sh.shipmentStatus === ShipmentStatus.DELIVERED).length / s.supply.shipments.length
        : 0.7;
    const rel = s.commercial.relationships;
    const trustAvg =
      rel.length > 0 ? rel.reduce((a, r) => a + (typeof r.trustLevel === "number" ? r.trustLevel : 0.5), 0) / rel.length : 0.55;

    const orgScore = Number(
      Math.min(1, Math.max(0, 0.55 + (1 - unpaidR) * 0.25 + shipOk * 0.15 + trustAvg * 0.15)).toFixed(3),
    );

    const terrCodes = s.finance.orders.map((o) => territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country));
    const uniqueTerr = new Set(terrCodes).size;
    const terrScore = Number(Math.min(1, Math.max(0, 0.5 + uniqueTerr * 0.02 - unpaidR * 0.3)).toFixed(3));

    const accepted = rel.filter((r) => r.status === RelationshipStatus.ACCEPTED).length;
    const netRes = rel.length > 0 ? Number((accepted / rel.length).toFixed(3)) : 0.5;

    const liqStress = Number(Math.min(1, unpaidR * 0.85 + (1 - shipOk) * 0.25).toFixed(3));
    const fulfillRel = Number(shipOk.toFixed(3));
    const relTrust = Number(Math.min(1, trustAvg).toFixed(3));

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "ACTIVE",
      organizationEconomicScore: {
        score: Number(orgScore),
        explanation: "Composite of payment health, fulfillment terminal rate, and relationship trust on producer snapshot.",
        sources: ["finance_orders", "supply_shipments", "commercial_relationships"],
      },
      territoryEconomicScore: {
        score: Number(terrScore),
        explanation: "Territory diversification vs unpaid concentration using shared territory normalizer.",
        sources: ["finance_orders:territoryNormalizedCodeFromOrg", `distinct_territories:${uniqueTerr}`],
      },
      networkResilienceScore: {
        score: netRes,
        explanation: "Accepted relationship ratio over active graph slice.",
        sources: ["commercial_relationships:status"],
      },
      liquidityStressScore: {
        score: liqStress,
        explanation: "Higher when unpaid ratio rises and shipments remain non-terminal.",
        sources: ["finance_orders:paymentStatus", "supply_shipments:shipmentStatus"],
      },
      fulfillmentReliabilityScore: {
        score: fulfillRel,
        explanation: "Share of delivered shipments in observation window.",
        sources: ["supply_shipments"],
      },
      relationshipTrustScore: {
        score: relTrust,
        explanation: "Mean trustLevel on relationship rows (bounded 0–1).",
        sources: ["commercial_relationships:trustLevel"],
      },
    };
  }
}
