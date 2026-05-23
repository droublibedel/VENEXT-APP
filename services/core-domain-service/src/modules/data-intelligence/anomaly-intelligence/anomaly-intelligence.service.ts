import { Injectable } from "@nestjs/common";
import { DeliveryStatus, NegotiationStatus, PaymentStatus, ShipmentStatus } from "@prisma/client";
import type { AnomalyIntelligenceResponse } from "@venext/shared-contracts";
import { territoryNormalizedCodeFromOrg } from "../../supply-logistics-intelligence/territory-code-normalizer";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

@Injectable()
export class AnomalyIntelligenceService {
  build(s: DataIntelligenceCrossCutSnapshot, enabled: boolean): AnomalyIntelligenceResponse {
    if (!enabled) {
      return { version: "1", generatedAt: s.generatedAt, organizationId: s.organizationId, policy: "DISABLED", anomalies: [] };
    }
    const anomalies: AnomalyIntelligenceResponse["anomalies"] = [];

    const failedDel = s.orderAdv.orders.filter((o) => o.deliveryStatus === DeliveryStatus.FAILED).length;
    if (failedDel > 0) {
      anomalies.push({
        id: "anom-delivery-fail",
        kind: "delivery_anomaly",
        severity: Number(Math.min(1, 0.35 + failedDel * 0.08).toFixed(3)),
        confidence: 0.74,
        impactedPoles: ["order_adv", "supply_logistics", "finance_collections"],
        propagationRisk: 0.62,
        territory: undefined,
        probableCause: "Execution lane breakage — carrier / dock / proof mismatch rather than demand collapse.",
        recommendedActions: [
          "Replay proof-of-dispatch vs negotiation commitments on affected corridors.",
          "Sequence settlement checkpoints before next ADV tranche on same relationship.",
        ],
      });
    }

    const unpaid = s.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID);
    if (unpaid.length > 2) {
      const t = territoryNormalizedCodeFromOrg(unpaid[0]!.buyer.city, unpaid[0]!.buyer.country);
      anomalies.push({
        id: "anom-payment-cluster",
        kind: "payment_anomaly",
        severity: Number(Math.min(1, 0.4 + unpaid.length * 0.05).toFixed(3)),
        confidence: 0.69,
        impactedPoles: ["finance_collections", "commercial_network"],
        propagationRisk: 0.71,
        territory: t,
        probableCause: "Payer cohort stress — liquidity or trust compression clustered by territory.",
        recommendedActions: ["Tighten proof cadence on electronic rails.", "Pair with distributor overload signal from ADV."],
      });
    }

    const blocked = s.supply.shipments.filter((sh) => sh.shipmentStatus === ShipmentStatus.BLOCKED).length;
    if (blocked > 0) {
      anomalies.push({
        id: "anom-shipment-block",
        kind: "logistics_anomaly",
        severity: 0.58,
        confidence: 0.66,
        impactedPoles: ["supply_logistics", "order_adv"],
        propagationRisk: 0.55,
        probableCause: "Corridor block — upstream commitment vs downstream motion desync.",
        recommendedActions: ["Re-sequence route commitments before accepting new ADV volume on same corridor."],
      });
    }

    const openNeg = s.orderAdv.negotiations.filter((n) => n.status === NegotiationStatus.OPEN).length;
    if (openNeg > 6) {
      anomalies.push({
        id: "anom-neg-saturation",
        kind: "negotiation_saturation",
        severity: Number(Math.min(1, openNeg * 0.07).toFixed(3)),
        confidence: 0.61,
        impactedPoles: ["order_adv", "marketing_activation"],
        propagationRisk: 0.48,
        probableCause: "Counter-offer churn without conversion — attention debt on activation surface.",
        recommendedActions: ["Throttle campaign pushes on territories with open ADV debt."],
      });
    }

    const relIds = new Set(s.commercial.relationships.map((r) => r.id));
    const orphanOrders = s.finance.orders.filter((o) => o.relationshipId && !relIds.has(o.relationshipId)).length;
    if (orphanOrders > 0) {
      anomalies.push({
        id: "anom-relational-drift",
        kind: "relational_drift",
        severity: 0.52,
        confidence: 0.81,
        impactedPoles: ["commercial_network", "finance_collections"],
        propagationRisk: 0.44,
        probableCause: "Orders referencing relationships absent from current graph slice — data coherence risk.",
        recommendedActions: ["Reconcile relationship archive vs active finance orders."],
      });
    }

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "ACTIVE",
      anomalies: anomalies.slice(0, 40),
    };
  }
}
