import { Injectable } from "@nestjs/common";
import type { PaymentPressureRadarResponse } from "@venext/shared-contracts";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { clamp01, daysBetween } from "../finance-collections-intelligence/finance-metrics.util";
import { territoryNormalizedCodeFromOrg } from "../supply-logistics-intelligence/territory-code-normalizer";

@Injectable()
export class PaymentPressureService {
  build(snapshot: FinanceCollectionsSnapshot, subOn: boolean): PaymentPressureRadarResponse {
    if (!subOn) {
      return {
        version: "1",
        generatedAt: snapshot.generatedAt,
        organizationId: snapshot.organizationId,
        policy: "DISABLED",
        overdueTerritories: [],
        unstableBuyers: [],
        collectionCollapseRisk: 0,
        paymentConcentrationIndex: 0,
        liquidityTensionIndex: 0,
      };
    }
    const now = new Date();
    const open = snapshot.orders.filter(
      (o) =>
        o.status !== OrderStatus.COMPLETED &&
        o.status !== OrderStatus.CANCELLED &&
        (o.paymentStatus === PaymentStatus.UNPAID ||
          o.paymentStatus === PaymentStatus.PARTIALLY_PAID ||
          o.paymentStatus === PaymentStatus.CREDIT ||
          o.paymentStatus === PaymentStatus.PAY_ON_DELIVERY),
    );
    const total = open.reduce((s, o) => s + o.totalAmount, 0) || 1;

    const byTerritory = new Map<
      string,
      { overdueMass: number; buyers: Set<string>; tension: number; delayCluster: number; gb: number }
    >();

    const byBuyer = new Map<
      string,
      { name: string; territory: string; mass: number; maxDelay: number; trustMin: number }
    >();

    for (const o of open) {
      const tc = territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country);
      let dd = daysBetween(o.createdAt, now);
      if (o.paymentStatus === PaymentStatus.PAY_ON_DELIVERY && o.deliveryStatus !== "DELIVERED") dd += 5;
      const overdueW = o.paymentStatus !== PaymentStatus.PAID && dd >= 10 ? o.totalAmount / total : 0;
      const cur = byTerritory.get(tc) ?? {
        overdueMass: 0,
        buyers: new Set<string>(),
        tension: 0,
        delayCluster: 0,
        gb: 0,
      };
      cur.overdueMass += overdueW;
      cur.buyers.add(o.buyerOrganizationId);
      cur.tension += (o.totalAmount / total) * (1 - o.relationship.trustLevel);
      cur.delayCluster += dd >= 7 ? o.totalAmount / total : 0;
      byTerritory.set(tc, cur);

      const b =
        byBuyer.get(o.buyerOrganizationId) ??
        {
          name: o.buyer.displayName,
          territory: tc,
          mass: 0,
          maxDelay: 0,
          trustMin: 1,
        };
      b.mass += o.totalAmount;
      b.maxDelay = Math.max(b.maxDelay, dd);
      b.trustMin = Math.min(b.trustMin, o.relationship.trustLevel);
      byBuyer.set(o.buyerOrganizationId, b);
    }

    const gbPressure = snapshot.groupBuyingSessions.reduce((s, g) => {
      const ratio = g.targetQuantity > 0 ? g.currentQuantity / g.targetQuantity : 0;
      const near = g.expiresAt.getTime() - now.getTime() < 86400000 * 3 ? 0.15 : 0;
      return s + clamp01(1 - ratio) * 0.2 + near;
    }, 0);
    for (const [tc, row] of byTerritory) {
      row.gb = clamp01(gbPressure);
      byTerritory.set(tc, row);
    }

    const overdueTerritories = [...byTerritory.entries()].map(([territoryCode, row]) => ({
      territoryCode,
      overdueMass: row.overdueMass,
      unstableBuyerCount: row.buyers.size,
      liquidityTension: clamp01(row.tension + row.overdueMass * 0.35),
      settlementDelayClusterScore: clamp01(row.delayCluster),
      groupBuyingPressureHint: clamp01(row.gb),
    }));

    const unstableBuyers = [...byBuyer.entries()]
      .map(([buyerOrganizationId, v]) => ({
        buyerOrganizationId,
        displayName: v.name,
        territoryCode: v.territory,
        accelerationScore: clamp01(v.maxDelay / 28),
        collapseRiskScore: clamp01((v.mass / total) * (1 - v.trustMin)),
        concentrationShare: clamp01(v.mass / total),
      }))
      .filter((b) => b.collapseRiskScore > 0.18 || b.accelerationScore > 0.35)
      .slice(0, 24);

    const maxConc = Math.max(0, ...[...byBuyer.values()].map((v) => v.mass / total));
    const collectionCollapseRisk = clamp01(maxConc * 0.55 + overdueTerritories.reduce((s, t) => s + t.overdueMass, 0) * 0.45);
    const paymentConcentrationIndex = clamp01(maxConc);
    const liquidityTensionIndex = clamp01(
      overdueTerritories.reduce((s, t) => s + t.liquidityTension, 0) / Math.max(1, overdueTerritories.length || 1),
    );

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: snapshot.organizationId,
      policy: "ACTIVE",
      overdueTerritories,
      unstableBuyers,
      collectionCollapseRisk,
      paymentConcentrationIndex,
      liquidityTensionIndex,
    };
  }
}
