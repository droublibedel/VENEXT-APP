import { Injectable } from "@nestjs/common";
import { DeliveryStatus, PaymentStatus, ShipmentStatus } from "@prisma/client";
import type { EconomicOntologyResponse } from "@venext/shared-contracts";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

@Injectable()
export class EconomicOntologyService {
  build(s: DataIntelligenceCrossCutSnapshot, enabled: boolean): EconomicOntologyResponse {
    if (!enabled) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        graphDensity: 0,
        poleConnectivity: {},
        dependencyChains: [],
        cascadingImpacts: [],
        economicPropagationScore: 0,
        orderFailureImpactNarrative: "Data intelligence disabled — ontology projection inactive.",
        entityCounts: {
          orders: 0,
          negotiations: 0,
          messages: 0,
          relationships: 0,
          wallets: 0,
          shipments: 0,
          economicSignals7d: 0,
        },
      };
    }

    const rel = s.commercial.relationships.length;
    const orders = s.orderAdv.orders.length;
    const negs = s.orderAdv.negotiations.length;
    let msgVol = 0;
    for (const n of s.orderAdv.messageCountByThread.values()) msgVol += n;
    const wallets = s.finance.wallets.length;
    const shipments = s.supply.shipments.length;

    const graphDensity = Number(Math.min(1, (rel * 0.6 + orders * 0.25 + negs * 0.35) / 420).toFixed(3));
    const poleConnectivity: Record<string, number> = {
      commercial_network: Number(Math.min(1, rel / 120).toFixed(3)),
      order_adv: Number(Math.min(1, (orders + negs) / 80).toFixed(3)),
      supply_logistics: Number(Math.min(1, (shipments + s.supply.orders.length) / 100).toFixed(3)),
      finance_collections: Number(Math.min(1, (s.finance.orders.length + wallets * 4) / 90).toFixed(3)),
      strategic_intelligence: Number(Math.min(1, s.economicSignals7d / 40).toFixed(3)),
    };

    const delayed = s.orderAdv.orders.filter(
      (o) => o.deliveryStatus === DeliveryStatus.FAILED || o.paymentStatus === PaymentStatus.UNPAID,
    ).length;
    const overdueMass = s.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID).length;
    const unstableShip = s.supply.shipments.filter(
      (sh) => sh.shipmentStatus === ShipmentStatus.DELAYED || sh.shipmentStatus === ShipmentStatus.BLOCKED,
    ).length;

    const propagation = Number(
      Math.min(1, delayed * 0.06 + overdueMass * 0.05 + unstableShip * 0.07 + negs * 0.02).toFixed(3),
    );

    const chains = [
      {
        id: "chain-order-finance",
        trigger: "Order execution stress",
        poles: ["order_adv", "finance_collections", "commercial_network"],
        narrative:
          "Delayed or blocked orders tighten receivable windows and compress distributor trust — payment discipline and corridor commitments move together.",
        propagationScore: Number(Math.min(1, propagation + 0.12).toFixed(3)),
      },
      {
        id: "chain-supply-territory",
        trigger: "Logistics instability",
        poles: ["supply_logistics", "marketing_activation", "order_adv"],
        narrative:
          "Shipment exceptions propagate to territory congestion signals and reservation pressure — ADV threads absorb downstream uncertainty.",
        propagationScore: Number(Math.min(1, unstableShip * 0.08 + s.supply.economicSignals.length * 0.01).toFixed(3)),
      },
    ];

    const cascading = [
      {
        scenario: "Single high-value order fails post-negotiation",
        polesAffected: ["finance_collections", "supply_logistics", "commercial_network", "order_adv"],
        severity: Number(Math.min(1, 0.35 + propagation * 0.5).toFixed(3)),
        explanation:
          "Receivable mass shifts, fulfillment replanning triggers, and retailer trust surfaces degrade in parallel — not sequential ERP stages.",
      },
    ];

    const narrative = `If a negotiated order fails: finance sees receivable + settlement risk; supply sees replanning + corridor load; territory sees congestion / payment geography coupling; commercial network sees trust compression on the relationship edge; activation sees campaign efficiency decay via downstream noise; confidence in ADV execution drops measurably.`;

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "ACTIVE",
      graphDensity,
      poleConnectivity,
      dependencyChains: chains,
      cascadingImpacts: cascading,
      economicPropagationScore: propagation,
      orderFailureImpactNarrative: narrative,
      entityCounts: {
        orders,
        negotiations: negs,
        messages: msgVol,
        relationships: rel,
        wallets,
        shipments,
        economicSignals7d: s.economicSignals7d,
      },
    };
  }
}
