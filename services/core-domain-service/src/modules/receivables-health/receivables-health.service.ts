import { Injectable } from "@nestjs/common";
import type { ReceivableHealthRow, ReceivablesHealthResponse } from "@venext/shared-contracts";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { clamp01, daysBetween } from "../finance-collections-intelligence/finance-metrics.util";
import { territoryNormalizedCodeFromOrg } from "../supply-logistics-intelligence/territory-code-normalizer";

@Injectable()
export class ReceivablesHealthService {
  build(snapshot: FinanceCollectionsSnapshot, poleOn: boolean): ReceivablesHealthResponse {
    if (!poleOn) {
      return {
        version: "1",
        generatedAt: snapshot.generatedAt,
        organizationId: snapshot.organizationId,
        policy: "DISABLED",
        rows: [],
        healthyCount: 0,
        delayedCount: 0,
        unstableCount: 0,
        blockedCount: 0,
        suspiciousCount: 0,
      };
    }
    const now = new Date();

    const rows: ReceivableHealthRow[] = snapshot.orders
      .filter((o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.DRAFT)
      .map((o) => {
        const dd = daysBetween(o.createdAt, now);
        const territoryCode = territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country);
        let healthStatus: ReceivableHealthRow["healthStatus"] = "HEALTHY";
        let recommendation = "Maintain cadence — settlement within tolerance.";
        let confidence = 0.72;

        if (o.relationship.status !== "ACCEPTED") {
          healthStatus = "BLOCKED";
          recommendation = "Graph edge not accepted — freeze incremental credit until relationship stabilizes.";
          confidence = 0.55;
        } else if (o.paymentStatus === PaymentStatus.CREDIT && o.totalAmount > 2_500_000) {
          healthStatus = "UNSTABLE";
          recommendation = "Credit-heavy mass — tighten collection cadence and instrument milestones.";
          confidence = 0.62;
        } else if (dd >= 14 && o.paymentStatus !== PaymentStatus.PAID) {
          healthStatus = "DELAYED";
          recommendation = "Delay exceeds corridor baseline — escalate settlement touchpoints.";
          confidence = 0.68;
        } else if (o.paymentStatus === PaymentStatus.PARTIALLY_PAID && dd >= 7) {
          healthStatus = "SUSPICIOUS";
          recommendation = "Partial settlement drift — verify proof-of-pay and reconcile ledger deltas.";
          confidence = 0.58;
        } else if (o.paymentStatus === PaymentStatus.PAID) {
          confidence = 0.81;
        }

        return {
          id: `recv-${o.id}`,
          healthStatus,
          outstandingAmount: o.paymentStatus === PaymentStatus.PAID ? 0 : o.totalAmount,
          currency: o.currency,
          delayDays: o.paymentStatus === PaymentStatus.PAID ? 0 : dd,
          buyerOrganizationId: o.buyerOrganizationId,
          buyerDisplayName: o.buyer.displayName,
          territoryCode,
          confidence: clamp01(confidence),
          recommendation,
          orderId: o.id,
        };
      })
      .filter((r) => r.outstandingAmount > 0 || r.healthStatus !== "HEALTHY");

    const healthyCount = rows.filter((r) => r.healthStatus === "HEALTHY").length;
    const delayedCount = rows.filter((r) => r.healthStatus === "DELAYED").length;
    const unstableCount = rows.filter((r) => r.healthStatus === "UNSTABLE").length;
    const blockedCount = rows.filter((r) => r.healthStatus === "BLOCKED").length;
    const suspiciousCount = rows.filter((r) => r.healthStatus === "SUSPICIOUS").length;

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: snapshot.organizationId,
      policy: "ACTIVE",
      rows: rows.slice(0, 80),
      healthyCount,
      delayedCount,
      unstableCount,
      blockedCount,
      suspiciousCount,
    };
  }
}
