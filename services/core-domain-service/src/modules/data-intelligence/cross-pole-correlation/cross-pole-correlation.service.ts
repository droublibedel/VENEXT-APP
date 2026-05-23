import { Injectable } from "@nestjs/common";
import { DeliveryStatus, GroupBuyingStatus, NegotiationStatus, PaymentStatus, ShipmentStatus } from "@prisma/client";
import type { CrossPoleCorrelationResponse } from "@venext/shared-contracts";
import { normalizeTerritoryLabel, territoryNormalizedCodeFromOrg } from "../../supply-logistics-intelligence/territory-code-normalizer";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

@Injectable()
export class CrossPoleCorrelationService {
  build(s: DataIntelligenceCrossCutSnapshot, enabled: boolean): CrossPoleCorrelationResponse {
    if (!enabled) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        rows: [],
        summary: "Cross-pole correlation engine disabled.",
      };
    }

    const rows: CrossPoleCorrelationResponse["rows"] = [];
    const delayedAdv = s.orderAdv.orders.filter((o) => o.deliveryStatus === DeliveryStatus.FAILED).length;
    const shipStress =
      s.supply.shipments.length > 0
        ? s.supply.shipments.filter((sh) => sh.shipmentStatus !== ShipmentStatus.DELIVERED).length / s.supply.shipments.length
        : 0;
    if (delayedAdv > 0 && shipStress > 0.2) {
      rows.push({
        id: "corr-adv-supply",
        kind: "sales_supply_execution",
        strength: Number(Math.min(1, delayedAdv * 0.08 + shipStress * 0.5).toFixed(3)),
        poles: ["order_adv", "supply_logistics"],
        sourcePoles: ["order_adv", "supply_logistics"],
        confidence: Number(Math.min(1, 0.5 + delayedAdv * 0.04).toFixed(3)),
        evidence: `${delayedAdv} ADV orders show delivery failure while ${(shipStress * 100).toFixed(0)}% of shipments remain non-terminal — execution coupling, not isolated KPIs.`,
        explanation: "ADV delivery failures co-occur with non-terminal shipment mass on the same producer org.",
        sourceFields: ["orderAdv.orders.deliveryStatus", "supply.shipments.shipmentStatus", "supply.shipments.length"],
      });
    }

    const unpaid = s.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID).length;
    if (unpaid > 0 && delayedAdv > 0) {
      rows.push({
        id: "corr-delay-finance",
        kind: "delays_finance",
        strength: Number(Math.min(1, 0.25 + unpaid * 0.04 + delayedAdv * 0.05).toFixed(3)),
        poles: ["order_adv", "finance_collections"],
        sourcePoles: ["order_adv", "finance_collections"],
        confidence: Number(Math.min(1, 0.48 + unpaid * 0.03).toFixed(3)),
        evidence: "Unpaid mass co-moves with failed / stalled delivery states — settlement risk is end-to-end economic, not treasury-only.",
        explanation: "Settlement stress reads across ADV execution and finance order payment flags.",
        sourceFields: ["finance.orders.paymentStatus", "orderAdv.orders.deliveryStatus"],
      });
    }

    const openNeg = s.orderAdv.negotiations.filter(
      (n) => n.status === NegotiationStatus.OPEN || n.status === NegotiationStatus.PROPOSED,
    ).length;
    const gbOpen = s.orderAdv.groupSessions.filter((g) => g.status === GroupBuyingStatus.OPEN).length;
    if (openNeg > 3 && gbOpen > 0) {
      const marketingReady = s.marketingSummary.available;
      rows.push({
        id: "corr-neg-saturation",
        kind: "negotiation_saturation",
        strength: Number(Math.min(1, openNeg * 0.06 + gbOpen * 0.05).toFixed(3)),
        poles: marketingReady ? ["order_adv", "marketing_activation"] : ["order_adv", "order_adv"],
        sourcePoles: marketingReady ? ["order_adv", "marketing_activation"] : ["order_adv", "order_adv"],
        confidence: Number(Math.min(1, 0.4 + openNeg * 0.02).toFixed(3)),
        evidence: marketingReady
          ? "Open negotiation surface plus active group-buy sessions indicates attention saturation — ADV absorbs activation spillover."
          : "Open negotiation surface plus active group-buy sessions — ADV-only read (marketingActivationSummary unavailable or disabled).",
        explanation: marketingReady
          ? "ADV negotiation + group-buy mass read against live marketing activation summary."
          : "ADV negotiation + group-buy mass only — do not infer marketing activation pressure without marketingSummary.available.",
        sourceFields: marketingReady
          ? ["orderAdv.negotiations.status", "orderAdv.groupSessions.status", "marketingSummary.metrics.activationVelocity"]
          : ["orderAdv.negotiations.status", "orderAdv.groupSessions.status"],
      });
    }

    const rel = s.commercial.relationships.length;
    const advOrders = s.orderAdv.orders.length;
    if (rel > 5 && advOrders > 5) {
      rows.push({
        id: "corr-network-adv",
        kind: "network_adv_performance",
        strength: Number(Math.min(1, Math.log10(rel + advOrders) / 2.2).toFixed(3)),
        poles: ["commercial_network", "order_adv"],
        sourcePoles: ["commercial_network", "order_adv"],
        confidence: Number(Math.min(1, 0.42 + advOrders * 0.008).toFixed(3)),
        evidence: "Relationship graph density correlates with transactional throughput — corridor-native commerce, not anonymous marketplace volume.",
        explanation: "Degree proxy from relationship rows + ADV order count on shared snapshot.",
        sourceFields: ["commercial.relationships.length", "orderAdv.orders.length"],
      });
    }

    const terrUnpaid = new Map<string, number>();
    for (const o of s.finance.orders) {
      if (o.paymentStatus !== PaymentStatus.UNPAID) continue;
      const tc = territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country);
      terrUnpaid.set(tc, (terrUnpaid.get(tc) ?? 0) + 1);
    }
    let topT = "";
    let topN = 0;
    for (const [t, n] of terrUnpaid) {
      if (n > topN) {
        topN = n;
        topT = t;
      }
    }
    if (topT && topN > 0) {
      rows.push({
        id: "corr-territory-finance",
        kind: "territory_overdue",
        strength: Number(Math.min(1, 0.2 + topN * 0.07).toFixed(3)),
        poles: ["finance_collections", "supply_logistics"],
        sourcePoles: ["finance_collections", "supply_logistics"],
        confidence: Number(Math.min(1, 0.36 + topN * 0.05).toFixed(3)),
        evidence: `Territory ${topT} concentrates unpaid mass — logistics and encaissement fields should be read jointly on that corridor.`,
        territoryHint: topT,
        affectedTerritories: [topT],
        explanation: "Unpaid concentration by normalized buyer territory couples finance with logistics naming.",
        sourceFields: ["finance.orders.buyer.city", "finance.orders.buyer.country", "finance.orders.paymentStatus"],
      });
    }

    const actVel = s.marketingSummary.metrics?.activationVelocity ?? 0;
    const terrStim = s.marketingSummary.metrics?.territoryStimulation ?? 0;
    const campPressure = Math.min(1, actVel * 0.55 + terrStim * 0.45);
    const delayedShip = s.supply.shipments.filter((sh) => sh.shipmentStatus === ShipmentStatus.DELAYED).length;
    const logisticsPressure = Number(Math.min(1, shipStress * 0.65 + delayedShip * 0.06 + s.supply.orders.length * 0.008).toFixed(3));

    if (s.marketingSummary.available && campPressure > 0.1 && logisticsPressure > 0.12) {
      const terrSet = new Set<string>();
      for (const g of s.supply.orgGeo.values()) {
        const n = normalizeTerritoryLabel(g);
        if (n.normalizedCode && n.normalizedCode !== "UNKNOWN") terrSet.add(n.normalizedCode);
      }
      const affectedTerritories = [...terrSet].slice(0, 8);
      const strength = Number(Math.min(1, campPressure * 0.45 + logisticsPressure * 0.55).toFixed(3));
      rows.push({
        id: "corr-campaign-logistics",
        kind: "campaign_logistics_correlation",
        strength,
        poles: ["marketing_activation", "supply_logistics"],
        sourcePoles: ["marketing_activation", "supply_logistics"],
        confidence: Number(Math.min(1, 0.35 + strength * 0.4 + (s.marketingSummary.confidence ?? 0) * 0.15).toFixed(3)),
        evidence: `Activation pressure (velocity ${actVel.toFixed(2)}, territory stimulation ${terrStim.toFixed(
          2,
        )}) overlaps logistics pressure ${logisticsPressure.toFixed(2)} — campaigns load corridors already under motion stress.`,
        affectedTerritories: affectedTerritories.length ? affectedTerritories : [topT || "UNKNOWN"],
        explanation: "Uses marketingSummary adapter metrics + supply shipment/order stress — no synthetic campaign rows.",
        sourceFields: [
          "marketingSummary.metrics.activationVelocity",
          "marketingSummary.metrics.territoryStimulation",
          "supply.shipments.shipmentStatus",
          "supply.orders.length",
        ],
      });
    }

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "ACTIVE",
      rows: rows.slice(0, 32),
      summary:
        rows.length === 0
          ? "No acute cross-pole correlations above detection threshold — maintain observatory density."
          : `${rows.length} correlation ridges active — systemic coupling detected across industrial poles.`,
    };
  }
}
