import { Injectable } from "@nestjs/common";
import type { CashflowIntelligenceResponse } from "@venext/shared-contracts";
import { PaymentStatus, TransactionStatus } from "@prisma/client";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { clamp01 } from "../finance-collections-intelligence/finance-metrics.util";

@Injectable()
export class CashflowIntelligenceService {
  build(snapshot: FinanceCollectionsSnapshot, poleOn: boolean): CashflowIntelligenceResponse {
    if (!poleOn) {
      return {
        version: "1",
        generatedAt: snapshot.generatedAt,
        organizationId: snapshot.organizationId,
        policy: "DISABLED",
        inflowStability: 0,
        delayedInflowSignal: 0,
        collectionAcceleration: 0,
        unstableCycleScore: 0,
        treasuryPressure: 0,
        settlementRhythmDegradation: 0,
      };
    }

    const orgTx = snapshot.transactions.filter((t) => t.organizationId === snapshot.organizationId);
    const posted = orgTx.filter((t) => t.status === TransactionStatus.POSTED || t.status === TransactionStatus.SUCCESS);
    const failed = orgTx.filter((t) => t.status === TransactionStatus.FAILED);

    const daily = new Map<string, { inflow: number; outflow: number }>();
    for (const t of posted) {
      const day = t.createdAt.toISOString().slice(0, 10);
      const slot = daily.get(day) ?? { inflow: 0, outflow: 0 };
      if (t.type === "PAYMENT" || t.type === "CREDIT") slot.inflow += Math.abs(t.amount);
      else slot.outflow += Math.abs(t.amount);
      daily.set(day, slot);
    }
    const series = [...daily.values()];
    const meanIn =
      series.length === 0 ? 0 : series.reduce((s, d) => s + d.inflow, 0) / series.length;
    const varIn =
      series.length === 0
        ? 0
        : series.reduce((s, d) => s + (d.inflow - meanIn) ** 2, 0) / series.length;
    const cv = meanIn > 0 ? Math.sqrt(varIn) / meanIn : 0.4;
    const inflowStability = clamp01(1 - cv * 0.85);

    const openReceivable = snapshot.orders.reduce((s, o) => {
      if (o.paymentStatus === PaymentStatus.PAID) return s;
      return s + o.totalAmount;
    }, 0);
    const delayedInflowSignal = clamp01(openReceivable / (openReceivable + meanIn * 14 + 1));

    const collectionAcceleration = clamp01(posted.length / 40 - failed.length / 12);

    const unstableCycleScore = clamp01(failed.length / Math.max(1, orgTx.length || 1) + cv * 0.35);

    const treasuryPressure = clamp01(
      snapshot.wallets
        .filter((w) => w.organizationId === snapshot.organizationId)
        .reduce((s, w) => s + (w.balance < 900_000 ? 1 : 0), 0) /
        Math.max(1, snapshot.wallets.filter((w) => w.organizationId === snapshot.organizationId).length || 1),
    );

    const settlementRhythmDegradation = clamp01(delayedInflowSignal * 0.55 + unstableCycleScore * 0.45);

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: snapshot.organizationId,
      policy: "ACTIVE",
      inflowStability,
      delayedInflowSignal,
      collectionAcceleration,
      unstableCycleScore,
      treasuryPressure,
      settlementRhythmDegradation,
    };
  }
}
