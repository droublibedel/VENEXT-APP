import { Injectable } from "@nestjs/common";
import type { PaymentAnomalyRadarResponse } from "@venext/shared-contracts";
import { OrderStatus, PaymentStatus, TransactionStatus } from "@prisma/client";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { clamp01, daysBetween } from "../finance-collections-intelligence/finance-metrics.util";

@Injectable()
export class PaymentAnomaliesService {
  build(snapshot: FinanceCollectionsSnapshot, poleOn: boolean): PaymentAnomalyRadarResponse {
    if (!poleOn) {
      return {
        version: "1",
        generatedAt: snapshot.generatedAt,
        organizationId: snapshot.organizationId,
        policy: "DISABLED",
        anomalies: [],
      };
    }
    const now = new Date();
    const anomalies: PaymentAnomalyRadarResponse["anomalies"] = [];

    for (const o of snapshot.orders) {
      if (o.status === OrderStatus.CANCELLED) continue;
      const dd = daysBetween(o.createdAt, now);
      if (o.paymentStatus === PaymentStatus.PARTIALLY_PAID && dd > 5) {
        anomalies.push({
          id: `ano-partial-${o.id}`,
          kind: "SUSPICIOUS_PATTERN",
          buyerOrganizationId: o.buyerOrganizationId,
          detail: "Partial payment persists beyond expected settlement window.",
          severity: clamp01(0.45 + dd / 40),
          relatedOrderIds: [o.id],
        });
      }
      if (dd >= 18 && o.paymentStatus !== PaymentStatus.PAID) {
        anomalies.push({
          id: `ano-lat-${o.id}`,
          kind: "ABNORMAL_LATENCY",
          buyerOrganizationId: o.buyerOrganizationId,
          detail: "Order age exceeds discipline corridor without closure.",
          severity: clamp01(0.5 + dd / 60),
          relatedOrderIds: [o.id],
        });
      }
    }

    const failed = snapshot.transactions.filter((t) => t.status === TransactionStatus.FAILED);
    for (const t of failed.slice(0, 12)) {
      anomalies.push({
        id: `ano-fail-${t.id}`,
        kind: "SETTLEMENT_INSTABILITY",
        buyerOrganizationId: t.organizationId === snapshot.organizationId ? undefined : t.organizationId,
        detail: "Repeated or isolated failed settlement attempts on wallet rail.",
        severity: 0.62,
        relatedOrderIds: [],
      });
    }

    const buyerVol = new Map<string, number>();
    for (const o of snapshot.orders) {
      buyerVol.set(o.buyerOrganizationId, (buyerVol.get(o.buyerOrganizationId) ?? 0) + 1);
    }
    for (const [buyer, n] of buyerVol) {
      if (n >= 4) {
        anomalies.push({
          id: `ano-payer-${buyer}`,
          kind: "INCONSISTENT_PAYER",
          buyerOrganizationId: buyer,
          detail: "High order churn vs payment closure — discipline mismatch risk.",
          severity: clamp01(0.35 + n / 20),
          relatedOrderIds: snapshot.orders.filter((o) => o.buyerOrganizationId === buyer).map((o) => o.id),
        });
      }
    }

    const walletJitter = snapshot.transactions.filter((t) => Math.abs(t.amount) > 5_000_000).length;
    if (walletJitter > 0) {
      anomalies.push({
        id: "ano-wallet-large",
        kind: "WALLET_MOVEMENT",
        detail: "Large magnitude wallet movements detected in trailing window.",
        severity: clamp01(0.4 + walletJitter / 10),
        relatedOrderIds: [],
      });
    }

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: snapshot.organizationId,
      policy: "ACTIVE",
      anomalies: anomalies.slice(0, 40),
    };
  }
}
