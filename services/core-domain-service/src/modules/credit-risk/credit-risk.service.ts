import { Injectable } from "@nestjs/common";
import type { CreditRiskMatrixResponse } from "@venext/shared-contracts";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { clamp01, daysBetween } from "../finance-collections-intelligence/finance-metrics.util";

@Injectable()
export class CreditRiskService {
  build(snapshot: FinanceCollectionsSnapshot, subOn: boolean): CreditRiskMatrixResponse {
    if (!subOn) {
      return {
        version: "1",
        generatedAt: snapshot.generatedAt,
        organizationId: snapshot.organizationId,
        policy: "DISABLED",
        rows: [],
        downstreamSolvencyRisk: 0,
        exposureConcentration: 0,
        collapseRiskField: 0,
      };
    }
    const now = new Date();
    const open = snapshot.orders.filter(
      (o) =>
        o.status !== OrderStatus.COMPLETED &&
        o.status !== OrderStatus.CANCELLED &&
        (o.paymentStatus === PaymentStatus.CREDIT ||
          o.paymentStatus === PaymentStatus.UNPAID ||
          o.paymentStatus === PaymentStatus.PARTIALLY_PAID),
    );
    const total = open.reduce((s, o) => s + o.totalAmount, 0) || 1;

    const rows = open
      .map((o) => {
        const dd = daysBetween(o.createdAt, now);
        const share = o.totalAmount / total;
        const instability = clamp01((1 - o.relationship.trustLevel) * 0.55 + (dd / 30) * 0.45);
        let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
        if (instability > 0.72 || share > 0.42) severity = "CRITICAL";
        else if (instability > 0.52 || share > 0.28) severity = "HIGH";
        else if (instability > 0.35) severity = "MEDIUM";

        const probableCause =
          o.paymentStatus === PaymentStatus.CREDIT
            ? "Credit-heavy exposure on downstream edge with uneven settlement rhythm."
            : dd >= 12
              ? "Settlement latency coupling with open receivable mass."
              : "Trust compression on relationship lane vs outstanding commercial paper.";

        return {
          id: `credit-${o.id}`,
          severity,
          exposureAmount: o.totalAmount,
          currency: o.currency,
          affectedOrganizationId: o.buyerOrganizationId,
          affectedDisplayName: o.buyer.displayName,
          probableCause,
          recommendation:
            severity === "CRITICAL" || severity === "HIGH"
              ? "Restrict incremental credit; sequence milestone settlements before new dispatch."
              : "Monitor lane weekly — reinforce proof-of-pay discipline on electronic rails.",
          confidence: clamp01(0.55 + share * 0.25 + (severity === "CRITICAL" ? 0.12 : 0)),
        };
      })
      .sort((a, b) => b.exposureAmount - a.exposureAmount)
      .slice(0, 24);

    const maxShare = Math.max(0, ...open.map((o) => o.totalAmount / total));
    const downstreamSolvencyRisk = clamp01(
      open.reduce((s, o) => s + (1 - o.relationship.trustLevel) * (o.totalAmount / total), 0),
    );
    const exposureConcentration = clamp01(maxShare);
    const collapseRiskField = clamp01(downstreamSolvencyRisk * 0.55 + exposureConcentration * 0.45);

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: snapshot.organizationId,
      policy: "ACTIVE",
      rows,
      downstreamSolvencyRisk,
      exposureConcentration,
      collapseRiskField,
    };
  }
}
