import { Injectable } from "@nestjs/common";
import type { FinanceOverviewResponse } from "@venext/shared-contracts";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { clamp01, daysBetween } from "../finance-collections-intelligence/finance-metrics.util";
import { territoryNormalizedCodeFromOrg } from "../supply-logistics-intelligence/territory-code-normalizer";

function isOpenReceivable(o: FinanceCollectionsSnapshot["orders"][0]): boolean {
  if (o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED) return false;
  return (
    o.paymentStatus === PaymentStatus.UNPAID ||
    o.paymentStatus === PaymentStatus.PARTIALLY_PAID ||
    o.paymentStatus === PaymentStatus.CREDIT ||
    o.paymentStatus === PaymentStatus.PAY_ON_DELIVERY
  );
}

function delayDays(o: FinanceCollectionsSnapshot["orders"][0], now: Date): number {
  if (o.paymentStatus === PaymentStatus.PAID) return 0;
  let d = daysBetween(o.createdAt, now);
  if (o.paymentStatus === PaymentStatus.PAY_ON_DELIVERY && o.deliveryStatus !== "DELIVERED") d += 4;
  return d;
}

@Injectable()
export class FinanceOverviewService {
  build(snapshot: FinanceCollectionsSnapshot, poleOn: boolean): FinanceOverviewResponse {
    const now = new Date();
    if (!poleOn) {
      return {
        version: "1",
        generatedAt: snapshot.generatedAt,
        organizationId: snapshot.organizationId,
        policy: "DISABLED",
        receivablesPressure: 0,
        overduePressure: 0,
        paymentReliability: 0,
        unstableAccounts: 0,
        delayedCollections: 0,
        walletLiquidityState: "NEUTRAL",
        downstreamSolvency: 0,
        paymentExecutionConfidence: 0,
        creditExposure: 0,
        financialInstability: 0,
        headline: "Finance / encaissements pole disabled by policy.",
        territoryStressTop: [],
      };
    }

    const open = snapshot.orders.filter(isOpenReceivable);
    const totalOpen = open.reduce((s, o) => s + o.totalAmount, 0) || 1;
    let overdueMass = 0;
    let delayed = 0;
    let unstable = 0;
    const territoryAgg = new Map<string, number>();

    for (const o of open) {
      const dd = delayDays(o, now);
      const w = o.totalAmount / totalOpen;
      if (dd >= 10) overdueMass += w;
      if (dd >= 7) delayed += 1;
      if (o.relationship.trustLevel < 0.42 || o.buyer.credibilityScore < 0.35) unstable += 1;
      const tc = territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country);
      territoryAgg.set(tc, (territoryAgg.get(tc) ?? 0) + o.totalAmount);
    }

    const paidish = snapshot.orders.filter(
      (o) => o.paymentStatus === PaymentStatus.PAID || o.paymentStatus === PaymentStatus.PARTIALLY_PAID,
    );
    const reliability =
      snapshot.orders.length === 0 ? 0.72 : paidish.length / Math.max(1, snapshot.orders.length);

    const sellerWallet = snapshot.wallets.filter((w) => w.organizationId === snapshot.organizationId);
    const avgBal =
      sellerWallet.length === 0 ? 0 : sellerWallet.reduce((s, w) => s + w.balance, 0) / sellerWallet.length;
    const lowBalRatio =
      sellerWallet.length === 0
        ? 0.5
        : sellerWallet.filter((w) => w.balance < 500_000).length / sellerWallet.length;
    const liquidityStress = clamp01(lowBalRatio * 0.85 + (avgBal < 1_000_000 ? 0.25 : 0));

    let walletState: FinanceOverviewResponse["walletLiquidityState"] = "NEUTRAL";
    if (liquidityStress > 0.72) walletState = "CRITICAL";
    else if (liquidityStress > 0.48) walletState = "STRESSED";
    else if (liquidityStress < 0.22) walletState = "STRONG";

    const creditHeavy = open.filter((o) => o.paymentStatus === PaymentStatus.CREDIT);
    const creditExposure = clamp01(creditHeavy.reduce((s, o) => s + o.totalAmount, 0) / totalOpen);

    const downstreamSolvency = clamp01(1 - overdueMass * 0.9 - (1 - reliability) * 0.35);

    const receivablesPressure = clamp01(overdueMass * 0.55 + open.length / 40);
    const overduePressure = clamp01(overdueMass);
    const paymentExecutionConfidence = clamp01(reliability * (1 - overdueMass * 0.4));

    const financialInstability = clamp01(
      receivablesPressure * 0.28 + overduePressure * 0.32 + creditExposure * 0.22 + (1 - downstreamSolvency) * 0.18,
    );

    const territoryStressTop = [...territoryAgg.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k]) => k);

    const policy: FinanceOverviewResponse["policy"] =
      financialInstability > 0.82 ? "DEGRADED" : "ACTIVE";

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: snapshot.organizationId,
      policy,
      receivablesPressure,
      overduePressure,
      paymentReliability: clamp01(reliability),
      unstableAccounts: unstable,
      delayedCollections: delayed,
      walletLiquidityState: walletState,
      downstreamSolvency,
      paymentExecutionConfidence,
      creditExposure,
      financialInstability,
      headline:
        overduePressure > 0.45
          ? "Receivable mass compressing execution confidence — supervise settlement lanes."
          : financialInstability > 0.55
            ? "Network financial tension elevated — prioritize discipline over volume optics."
            : "Encaissement field stable with residual delay pockets — maintain observatory cadence.",
      territoryStressTop,
    };
  }
}
