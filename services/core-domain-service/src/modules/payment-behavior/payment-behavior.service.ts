import { Injectable } from "@nestjs/common";
import type { PaymentBehaviorObservatoryResponse } from "@venext/shared-contracts";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { clamp01, daysBetween } from "../finance-collections-intelligence/finance-metrics.util";
import { territoryNormalizedCodeFromOrg } from "../supply-logistics-intelligence/territory-code-normalizer";

@Injectable()
export class PaymentBehaviorService {
  build(snapshot: FinanceCollectionsSnapshot, poleOn: boolean): PaymentBehaviorObservatoryResponse {
    if (!poleOn) {
      return {
        version: "1",
        generatedAt: snapshot.generatedAt,
        organizationId: snapshot.organizationId,
        policy: "DISABLED",
        payers: [],
        networkVolatilityIndex: 0,
      };
    }
    const now = new Date();
    const byBuyer = new Map<
      string,
      {
        name: string;
        territory: string;
        delays: number[];
        statuses: PaymentStatus[];
        trust: number;
      }
    >();

    for (const o of snapshot.orders) {
      if (o.status === OrderStatus.CANCELLED || o.status === OrderStatus.DRAFT) continue;
      const tc = territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country);
      let slot = byBuyer.get(o.buyerOrganizationId);
      if (!slot) {
        slot = { name: o.buyer.displayName, territory: tc, delays: [], statuses: [], trust: 1 };
      }
      slot.delays.push(o.paymentStatus === PaymentStatus.PAID ? 0 : daysBetween(o.createdAt, now));
      slot.statuses.push(o.paymentStatus);
      slot.trust = Math.min(slot.trust, o.relationship.trustLevel);
      byBuyer.set(o.buyerOrganizationId, slot);
    }

    const negsByBuyer = new Map<string, number>();
    for (const n of snapshot.negotiations) {
      negsByBuyer.set(n.buyerOrganizationId, (negsByBuyer.get(n.buyerOrganizationId) ?? 0) + 1);
    }

    const payers = [...byBuyer.entries()].map(([buyerOrganizationId, v]) => {
      const late = v.delays.filter((d) => d >= 7).length;
      const mean = v.delays.reduce((s, d) => s + d, 0) / Math.max(1, v.delays.length);
      const varc =
        v.delays.reduce((s, d) => s + (d - mean) ** 2, 0) / Math.max(1, v.delays.length);
      const volatilityScore = clamp01(Math.sqrt(varc) / 22);
      const disciplineScore = clamp01(1 - late / Math.max(1, v.delays.length) - (1 - v.trust) * 0.35);
      const mismatchRaw = (negsByBuyer.get(buyerOrganizationId) ?? 0) / Math.max(1, v.delays.length);
      const negotiationPaymentMismatch = clamp01(mismatchRaw * 0.55 + (late > 0 ? 0.22 : 0));

      let recurrenceQuality: "STRONG" | "MIXED" | "WEAK" = "MIXED";
      if (disciplineScore > 0.72 && volatilityScore < 0.28) recurrenceQuality = "STRONG";
      else if (disciplineScore < 0.45 || volatilityScore > 0.52) recurrenceQuality = "WEAK";

      let bucket: "RELIABLE" | "UNSTABLE" | "DEGRADED" = "RELIABLE";
      if (disciplineScore < 0.42 || volatilityScore > 0.48) bucket = "UNSTABLE";
      if (disciplineScore < 0.28 && late >= 2) bucket = "DEGRADED";

      return {
        buyerOrganizationId,
        displayName: v.name,
        territoryCode: v.territory,
        disciplineScore,
        volatilityScore,
        latePaymentStreak: late,
        negotiationPaymentMismatch,
        recurrenceQuality,
        bucket,
      };
    });

    const networkVolatilityIndex = clamp01(
      payers.length ? payers.reduce((s, p) => s + p.volatilityScore, 0) / payers.length : 0,
    );

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: snapshot.organizationId,
      policy: "ACTIVE",
      payers: payers.slice(0, 48),
      networkVolatilityIndex,
    };
  }
}
