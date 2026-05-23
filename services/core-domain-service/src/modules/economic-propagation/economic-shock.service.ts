import { Injectable } from "@nestjs/common";
import { DeliveryStatus, NegotiationStatus, PaymentStatus, ShipmentStatus, WalletStatus } from "@prisma/client";
import type { EconomicShock } from "@venext/shared-contracts";
import { territoryNormalizedCodeFromOrg } from "../supply-logistics-intelligence/territory-code-normalizer";
import type { EconomicPropagationSnapshot } from "./economic-propagation-engine.service";

function sevFrom01(x: number): EconomicShock["severity"] {
  if (x >= 0.75) return "CRITICAL";
  if (x >= 0.55) return "HIGH";
  if (x >= 0.35) return "MODERATE";
  return "LOW";
}

function buildShockDeduplicationKey(sh: EconomicShock): string {
  const terr = [...sh.affectedTerritories].sort().join("|") || "_NONE_";
  const sigFingerprint = sh.sourceSignals.join(";").slice(0, 400);
  return `${sh.type}|${sh.sourcePole}|${terr}|${sigFingerprint}`;
}

@Injectable()
export class EconomicShockService {
  detect(s: EconomicPropagationSnapshot): EconomicShock[] {
    const createdAt = s.generatedAt;
    const org = s.organizationId;
    const shocks: EconomicShock[] = [];

    const delayed = s.supply.shipments.filter((sh) => sh.shipmentStatus === ShipmentStatus.DELAYED).length;
    const blocked = s.supply.shipments.filter((sh) => sh.shipmentStatus === ShipmentStatus.BLOCKED).length;
    const nonTerminal =
      s.supply.shipments.length > 0
        ? s.supply.shipments.filter((sh) => sh.shipmentStatus !== ShipmentStatus.DELIVERED).length / s.supply.shipments.length
        : 0;
    if (delayed > 0 || blocked > 0 || nonTerminal > 0.35) {
      const sys = Number(Math.min(1, delayed * 0.08 + blocked * 0.1 + nonTerminal * 0.55).toFixed(3));
      shocks.push({
        id: `shock-shipment_delayed-${org.slice(0, 8)}`,
        type: "shipment_delayed",
        sourcePole: "supply_logistics",
        sourceEntityType: "shipment_batch",
        severity: sevFrom01(sys),
        confidence: Number(Math.min(1, 0.55 + nonTerminal * 0.25).toFixed(3)),
        affectedPoles: ["supply_logistics", "order_adv", "finance_collections"],
        affectedTerritories: [...new Set(s.supply.orgGeo ? Array.from(s.supply.orgGeo.values()).slice(0, 6) : [])].map((g) =>
          territoryNormalizedCodeFromOrg(g.split("/")[1]?.trim() ?? "", g.split("/")[0]?.trim() ?? ""),
        ),
        systemicRisk: sys,
        sourceSignals: [
          `supply.shipments.delayedCount:${delayed}`,
          `supply.shipments.blockedCount:${blocked}`,
          `supply.shipments.nonTerminalShare:${nonTerminal.toFixed(3)}`,
        ],
        explanation: "Non-terminal shipment mass or explicit delay/blocked states couple corridor motion to downstream settlement risk.",
        createdAt,
      });
    }

    const unpaid = s.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID);
    const unpaidRatio = s.finance.orders.length > 0 ? unpaid.length / s.finance.orders.length : 0;
    const walletSum = s.finance.wallets.reduce((a, w) => a + w.balance, 0);
    const limited = s.finance.wallets.some((w) => w.status === WalletStatus.LIMITED);
    if (unpaidRatio > 0.12 || (limited && walletSum < 5_000_000)) {
      const sys = Number(Math.min(1, unpaidRatio * 0.9 + (limited ? 0.22 : 0) + (walletSum < 3_000_000 ? 0.2 : 0)).toFixed(3));
      shocks.push({
        id: `shock-liquidity_collapse-${org.slice(0, 8)}`,
        type: "liquidity_collapse",
        sourcePole: "finance_collections",
        sourceEntityType: "treasury_window",
        severity: sevFrom01(sys),
        confidence: Number(Math.min(1, 0.5 + unpaidRatio * 0.35).toFixed(3)),
        affectedPoles: ["finance_collections", "order_adv", "commercial_network"],
        affectedTerritories: unpaid[0]
          ? [territoryNormalizedCodeFromOrg(unpaid[0]!.buyer.city, unpaid[0]!.buyer.country)]
          : [],
        systemicRisk: sys,
        sourceSignals: [
          `finance.orders.unpaidRatio:${unpaidRatio.toFixed(3)}`,
          `finance.wallets.aggregateBalance:${walletSum}`,
          `finance.wallets.hasLimited:${limited}`,
        ],
        explanation: "Unpaid concentration and/or thin treasury buffer compress settlement runway — liquidity shock couples to ADV acceptance.",
        createdAt,
      });
    }

    if (unpaidRatio > 0.2 && s.orderAdv.orders.length > 8) {
      const sys = Number(Math.min(1, unpaidRatio * 0.7 + s.orderAdv.orders.length * 0.004).toFixed(3));
      shocks.push({
        id: `shock-territory_overheating-${org.slice(0, 8)}`,
        type: "territory_overheating",
        sourcePole: "finance_collections",
        sourceEntityType: "territory_receivable_mass",
        severity: sevFrom01(sys),
        confidence: 0.62,
        affectedPoles: ["finance_collections", "supply_logistics", "data_intelligence"],
        affectedTerritories: unpaid.slice(0, 4).map((o) => territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country)),
        systemicRisk: sys,
        sourceSignals: [`finance.orders.unpaidRatio:${unpaidRatio.toFixed(3)}`, `orderAdv.orders.count:${s.orderAdv.orders.length}`],
        explanation: "Order throughput co-locates with unpaid mass — territory-level economic overheating vs logistics naming.",
        createdAt,
      });
    }

    const lowTrust = s.commercial.relationships.filter((r) => typeof r.trustLevel === "number" && r.trustLevel < 0.42).length;
    if (lowTrust > 4 && s.commercial.relationships.length > 15) {
      const sys = Number(Math.min(1, lowTrust * 0.06 + (1 - s.commercial.relationships.length / 400)).toFixed(3));
      shocks.push({
        id: `shock-relationship_fragmentation-${org.slice(0, 8)}`,
        type: "relationship_fragmentation",
        sourcePole: "commercial_network",
        sourceEntityType: "relationship_graph_slice",
        severity: sevFrom01(sys),
        confidence: 0.58,
        affectedPoles: ["commercial_network", "marketing_activation", "order_adv"],
        affectedTerritories: [],
        systemicRisk: sys,
        sourceSignals: [`commercial.relationships.lowTrustCount:${lowTrust}`, `commercial.relationships.total:${s.commercial.relationships.length}`],
        explanation: "Trust compression on active relationship slice weakens corridor-native execution — propagates to activation efficiency.",
        createdAt,
      });
    }

    if (unpaidRatio > 0.08) {
      shocks.push({
        id: `shock-payment_instability-${org.slice(0, 8)}`,
        type: "payment_instability",
        sourcePole: "finance_collections",
        sourceEntityType: "payment_status_mix",
        severity: sevFrom01(unpaidRatio * 1.1),
        confidence: Number(Math.min(1, 0.52 + unpaidRatio).toFixed(3)),
        affectedPoles: ["finance_collections", "order_adv"],
        affectedTerritories: unpaid.slice(0, 3).map((o) => territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country)),
        systemicRisk: Number(Math.min(1, unpaidRatio * 1.05).toFixed(3)),
        sourceSignals: [`finance.orders.unpaidRatio:${unpaidRatio.toFixed(3)}`, `finance.orders.unpaidCount:${unpaid.length}`],
        explanation: "Receivable discipline degrades — ADV and corridor commitments inherit payment tail risk.",
        createdAt,
      });
    }

    const rel = s.commercial.relationships.length;
    const adv = s.orderAdv.orders.length;
    if (rel > 60 && adv > 25) {
      const sys = Number(Math.min(1, Math.log10(rel + adv) / 2.5).toFixed(3));
      shocks.push({
        id: `shock-network_saturation-${org.slice(0, 8)}`,
        type: "network_saturation",
        sourcePole: "commercial_network",
        sourceEntityType: "graph_density",
        severity: sevFrom01(sys),
        confidence: 0.55,
        affectedPoles: ["commercial_network", "order_adv", "supply_logistics"],
        affectedTerritories: [],
        systemicRisk: sys,
        sourceSignals: [`commercial.relationships.count:${rel}`, `orderAdv.orders.count:${adv}`],
        explanation: "Dense relationship throughput with elevated ADV mass increases congestion risk on shared corridors.",
        createdAt,
      });
    }

    if (nonTerminal > 0.25 && s.supply.orders.length > 12) {
      const sys = Number(Math.min(1, nonTerminal * 0.55 + s.supply.orders.length * 0.006).toFixed(3));
      shocks.push({
        id: `shock-distribution_fragility-${org.slice(0, 8)}`,
        type: "distribution_fragility",
        sourcePole: "supply_logistics",
        sourceEntityType: "distribution_window",
        severity: sevFrom01(sys),
        confidence: 0.6,
        affectedPoles: ["supply_logistics", "marketing_activation", "finance_collections"],
        affectedTerritories: [],
        systemicRisk: sys,
        sourceSignals: [`supply.shipments.nonTerminalShare:${nonTerminal.toFixed(3)}`, `supply.orders.count:${s.supply.orders.length}`],
        explanation: "Distribution motion lags order commitments — activation and receivable fields absorb downstream noise.",
        createdAt,
      });
    }

    const openNeg = s.orderAdv.negotiations.filter((n) => n.status === NegotiationStatus.OPEN || n.status === NegotiationStatus.PROPOSED).length;
    if (openNeg > 6) {
      const sys = Number(Math.min(1, openNeg * 0.07).toFixed(3));
      shocks.push({
        id: `shock-negotiation_collapse-${org.slice(0, 8)}`,
        type: "negotiation_collapse",
        sourcePole: "order_adv",
        sourceEntityType: "negotiation_surface",
        severity: sevFrom01(sys),
        confidence: 0.57,
        affectedPoles: ["order_adv", "finance_collections", "commercial_network"],
        affectedTerritories: [],
        systemicRisk: sys,
        sourceSignals: [`orderAdv.negotiations.openOrProposed:${openNeg}`, `negotiationMetrics.total:${s.negotiationMetrics.totalNegotiationsCount}`],
        explanation: "Open negotiation surface density risks conversion collapse — counter-offer churn without settlement discipline.",
        createdAt,
      });
    }

    if (blocked > 0 || delayed > 2) {
      shocks.push({
        id: `shock-supply_chain_stress-${org.slice(0, 8)}`,
        type: "supply_chain_stress",
        sourcePole: "supply_logistics",
        sourceEntityType: "execution_exceptions",
        severity: sevFrom01(Math.min(1, 0.35 + blocked * 0.12 + delayed * 0.05)),
        confidence: 0.61,
        affectedPoles: ["supply_logistics", "order_adv"],
        affectedTerritories: [],
        systemicRisk: Number(Math.min(1, 0.3 + blocked * 0.14 + delayed * 0.06).toFixed(3)),
        sourceSignals: [`supply.shipments.blockedCount:${blocked}`, `supply.shipments.delayedCount:${delayed}`],
        explanation: "Explicit execution exceptions stress hub sequencing before finance sees receivable movement.",
        createdAt,
      });
    }

    const failedAdv = s.orderAdv.orders.filter((o) => o.deliveryStatus === DeliveryStatus.FAILED).length;
    if (failedAdv > 0 && unpaidRatio > 0.05) {
      const sys = Number(Math.min(1, failedAdv * 0.12 + unpaidRatio * 0.5).toFixed(3));
      shocks.push({
        id: `shock-cashflow_pressure-${org.slice(0, 8)}`,
        type: "cashflow_pressure",
        sourcePole: "finance_collections",
        sourceEntityType: "adv_finance_coupling",
        severity: sevFrom01(sys),
        confidence: 0.64,
        affectedPoles: ["finance_collections", "order_adv"],
        affectedTerritories: [],
        systemicRisk: sys,
        sourceSignals: [`orderAdv.orders.deliveryFailed:${failedAdv}`, `finance.orders.unpaidRatio:${unpaidRatio.toFixed(3)}`],
        explanation: "ADV execution failures co-move with receivable stress — cashflow coupling across poles, not isolated KPIs.",
        createdAt,
      });
    }

    if (s.dataIntelligence.available && s.dataIntelligence.bundle?.anomalies.anomalies.length) {
      for (const a of s.dataIntelligence.bundle.anomalies.anomalies.slice(0, 3)) {
        shocks.push({
          id: `shock-di_${a.id}`,
          type: `data_intelligence_${a.kind}`,
          sourcePole: "data_intelligence",
          sourceEntityType: "anomaly",
          sourceEntityId: a.id,
          severity: sevFrom01(a.severity),
          confidence: a.confidence,
          affectedPoles: a.impactedPoles,
          affectedTerritories: a.territory ? [a.territory] : [],
          systemicRisk: Number(Math.min(1, a.severity * 0.85 + a.propagationRisk * 0.15).toFixed(3)),
          sourceSignals: [`dataIntelligence.anomalies.${a.id}`, `anomaly.kind:${a.kind}`],
          explanation: a.probableCause,
          createdAt,
        });
      }
    }

    const ts = s.marketingSummary.metrics?.territoryStimulation ?? 0;
    const ce = s.marketingSummary.metrics?.campaignEffectiveness ?? 0;
    if (s.marketingSummary.available && ts > 0.42 && ce < 0.42) {
      const sys = Number(Math.min(1, ts * 0.55 + (1 - ce) * 0.35).toFixed(3));
      shocks.push({
        id: `shock-campaign_overheating-${org.slice(0, 8)}`,
        type: "campaign_overheating",
        sourcePole: "marketing_activation",
        sourceEntityType: "activation_surface",
        severity: sevFrom01(sys),
        confidence: Number(Math.min(1, 0.5 + ts * 0.2).toFixed(3)),
        affectedPoles: ["marketing_activation", "order_adv", "supply_logistics", "finance_collections"],
        affectedTerritories: [],
        systemicRisk: sys,
        sourceSignals: [
          `marketingSummary.metrics.territoryStimulation:${ts.toFixed(3)}`,
          `marketingSummary.metrics.campaignEffectiveness:${ce.toFixed(3)}`,
        ],
        explanation: "Territory stimulation outpaces campaign effectiveness — activation overheats corridors before conversion lift.",
        createdAt,
      });
    }

    const keyed = shocks.map((sh) => ({ ...sh, deduplicationKey: buildShockDeduplicationKey(sh) }));
    const dedup = new Map<string, EconomicShock>();
    for (const sh of keyed) {
      if (!dedup.has(sh.deduplicationKey!)) dedup.set(sh.deduplicationKey!, sh);
    }
    return [...dedup.values()].slice(0, 24);
  }
}
