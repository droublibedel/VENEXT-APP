import { Injectable } from "@nestjs/common";
import { PaymentStatus } from "@prisma/client";
import type { TerritoryIntelligenceResponse } from "@venext/shared-contracts";
import { territoryNormalizedCodeFromOrg } from "../../supply-logistics-intelligence/territory-code-normalizer";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

@Injectable()
export class TerritoryIntelligenceService {
  build(s: DataIntelligenceCrossCutSnapshot, enabled: boolean): TerritoryIntelligenceResponse {
    if (!enabled) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        fragileTerritories: [],
        crossPoleStress: 0,
        narrative: "Territory intelligence disabled.",
      };
    }
    const agg = new Map<string, { unpaid: number; orders: number }>();
    for (const o of s.finance.orders) {
      const code = territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country);
      const cur = agg.get(code) ?? { unpaid: 0, orders: 0 };
      cur.orders += 1;
      if (o.paymentStatus === PaymentStatus.UNPAID) cur.unpaid += 1;
      agg.set(code, cur);
    }
    const fragile = [...agg.entries()]
      .map(([territoryCode, v]) => ({
        territoryCode,
        fragilityScore: Number(Math.min(1, v.unpaid * 0.12 + v.orders * 0.02).toFixed(3)),
        drivers: [
          v.unpaid > 0 ? `${v.unpaid} unpaid orders` : "Low unpaid but elevated order mass",
          "Cross-read with supply corridor keys on same territory lattice.",
        ],
      }))
      .filter((x) => x.fragilityScore > 0.08)
      .sort((a, b) => b.fragilityScore - a.fragilityScore)
      .slice(0, 12);

    const crossPoleStress = Number(
      Math.min(1, fragile.reduce((m, x) => Math.max(m, x.fragilityScore), 0) * 0.9 + s.supply.economicSignals.length * 0.01).toFixed(3),
    );

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "ACTIVE",
      fragileTerritories: fragile,
      crossPoleStress,
      narrative:
        "Territories are economic correlation keys — fragile codes couple finance unpaid mass with logistics corridor naming and activation spend gravity.",
    };
  }
}
