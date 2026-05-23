import { Injectable } from "@nestjs/common";
import type { OrderRiskMatrixResponse, OrderRiskMatrixRow } from "@venext/shared-contracts";
import { GroupBuyingStatus, NegotiationStatus, OrderStatus } from "@prisma/client";
import type { OrderAdvRawSnapshot } from "../order-adv-intelligence/order-adv-data.service";

@Injectable()
export class OrderRiskService {
  build(snapshot: OrderAdvRawSnapshot, enabled: boolean): OrderRiskMatrixResponse {
    const { organizationId, generatedAt, orders, negotiations, groupSessions } = snapshot;
    if (!enabled) {
      return { generatedAt, organizationId, policy: "DISABLED", rows: [] };
    }

    const rows: OrderRiskMatrixRow[] = [];
    const now = Date.now();

    const stalledOrders = orders.filter(
      (o) => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED && now - o.updatedAt.getTime() > 120 * 3600000,
    );
    if (stalledOrders.length) {
      rows.push({
        id: "risk-stalled-orders",
        severity: stalledOrders.length > 6 ? "elevated" : "watch",
        affectedOrganizationIds: [...new Set(stalledOrders.flatMap((o) => [o.buyerOrganizationId, o.sellerOrganizationId]))].slice(0, 8),
        probableCause: "Downstream confirmations / fulfillment cadence drift vs negotiation velocity.",
        recommendation: "Supervise ADV queue — prioritize distributor confirmations before pressure compounds.",
        confidence: 0.72,
        relatedSignals: ["order_age", "delivery_status_stale"],
      });
    }

    const negBurst = negotiations.filter((n) => n.status === NegotiationStatus.PROPOSED).length;
    if (negBurst > 8) {
      rows.push({
        id: "risk-negotiation-burst",
        severity: "elevated",
        affectedOrganizationIds: [organizationId],
        probableCause: "Counter-offer churn without conversion — relationship trust surface thinning.",
        recommendation: "Escalate negotiation desk — pair with conversational commerce anchors.",
        confidence: 0.66,
        relatedSignals: ["negotiation_open_loop", `proposed_count:${negBurst}`],
      });
    }

    const stalledGb = groupSessions.filter(
      (g) => g.status === GroupBuyingStatus.OPEN && g.expiresAt.getTime() - now < 48 * 3600000,
    ).length;
    if (stalledGb > 2) {
      rows.push({
        id: "risk-group-buy-stall",
        severity: "watch",
        affectedOrganizationIds: [organizationId],
        probableCause: "Grouped buying sessions near expiry with low threshold fill.",
        recommendation: "Reinforce retailer participation vectors or rebalance thresholds.",
        confidence: 0.58,
        relatedSignals: ["group_buy_expiry_pressure"],
      });
    }

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      rows,
    };
  }
}
