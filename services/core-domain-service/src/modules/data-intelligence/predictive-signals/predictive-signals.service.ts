import { Injectable } from "@nestjs/common";
import { PaymentStatus, ShipmentStatus } from "@prisma/client";
import type { PredictiveSignalsResponse } from "@venext/shared-contracts";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

@Injectable()
export class PredictiveSignalsService {
  build(s: DataIntelligenceCrossCutSnapshot, enabled: boolean, predictiveOn: boolean): PredictiveSignalsResponse {
    if (!enabled) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        signals: [],
      };
    }
    if (!predictiveOn) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        signals: [],
      };
    }
    const signals: PredictiveSignalsResponse["signals"] = [];
    const { openNegotiationsCount, stalledNegotiationsCount, totalNegotiationsCount } = s.negotiationMetrics;

    const unpaidRatio =
      s.finance.orders.length > 0
        ? s.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID).length / s.finance.orders.length
        : 0;
    if (unpaidRatio > 0.15) {
      signals.push({
        id: "pred-pay-fail",
        kind: "probable_payment_failure",
        confidence: Number(Math.min(0.9, 0.45 + unpaidRatio).toFixed(3)),
        timeHorizon: "7d",
        predictionBasis: "Unpaid ratio vs rolling order mass on producer snapshot.",
        sourceSignals: [
          "finance_orders_unpaid_ratio",
          `negotiation.openCount:${openNegotiationsCount}`,
          `negotiation.stalledCount:${stalledNegotiationsCount}`,
        ],
        headline: "Payment failure cascade probable unless settlement cadence tightens within a week.",
        riskLevel: Number(Math.min(1, unpaidRatio * 1.2).toFixed(3)),
      });
    }

    const delayedShip = s.supply.shipments.filter((sh) => sh.shipmentStatus === ShipmentStatus.DELAYED).length;
    if (delayedShip > 1 || s.supply.orders.length > 20) {
      signals.push({
        id: "pred-supply-sat",
        kind: "future_supply_saturation",
        confidence: 0.58,
        timeHorizon: "72h",
        predictionBasis: "Non-terminal shipment ratio + order throughput on same producer org.",
        sourceSignals: ["supply_shipments", "supply_orders_window"],
        headline: "Hub and corridor saturation risk — sequencing pressure before next activation wave.",
        riskLevel: Number(Math.min(1, 0.35 + delayedShip * 0.06).toFixed(3)),
      });
    }

    if (openNegotiationsCount > 5 || stalledNegotiationsCount > 2) {
      signals.push({
        id: "pred-neg-collapse",
        kind: "negotiation_collapse",
        confidence: Number(Math.min(0.82, 0.48 + openNegotiationsCount * 0.03 + stalledNegotiationsCount * 0.05).toFixed(3)),
        timeHorizon: "24h",
        predictionBasis: "Open / stalled negotiation surface vs total negotiation inventory (Instruction 17A alignment).",
        sourceSignals: [
          `negotiation.openCount:${openNegotiationsCount}`,
          `negotiation.stalledCount:${stalledNegotiationsCount}`,
          `negotiation.totalCount:${totalNegotiationsCount}`,
        ],
        headline: "Negotiation collapse envelope — counter-offer loops may decay without executive mediation.",
        riskLevel: Number(Math.min(1, 0.32 + openNegotiationsCount * 0.05 + stalledNegotiationsCount * 0.07).toFixed(3)),
      });
    }

    signals.push({
      id: "pred-territory-destab",
      kind: "territory_destabilization",
      confidence: 0.52,
      timeHorizon: "30d",
      predictionBasis: "Economic signal density + overdue clustering (heuristic v1).",
      sourceSignals: [`economic_signals_7d:${s.economicSignals7d}`],
      headline: "Territory destabilization tail risk — cross-pole stress if activation spend rises.",
      riskLevel: Number(Math.min(1, s.economicSignals7d * 0.02).toFixed(3)),
    });

    const distTension = s.strategicSummary.metrics?.distributionTension ?? 0;
    const strategicHealth = s.strategicSummary.metrics?.strategicHealth ?? 0.5;
    if (s.strategicSummary.available && (distTension > 0.42 || unpaidRatio > 0.12)) {
      signals.push({
        id: "pred-risk-escalation",
        kind: "risk_escalation",
        confidence: Number(Math.min(0.88, 0.44 + distTension * 0.35 + unpaidRatio * 0.4).toFixed(3)),
        timeHorizon: "7d",
        predictionBasis: "Strategic distribution tension + receivable stress on shared snapshot.",
        sourceSignals: [
          "strategicSummary.metrics.distributionTension",
          "strategicSummary.metrics.strategicHealth",
          "finance_orders_unpaid_ratio",
        ],
        headline: "Risk escalation field — strategic tension and settlement drag may compound within a week.",
        riskLevel: Number(Math.min(1, distTension * 0.55 + (1 - strategicHealth) * 0.35).toFixed(3)),
      });
    }

    const campEff = s.marketingSummary.metrics?.campaignEffectiveness ?? 0;
    const terrStim = s.marketingSummary.metrics?.territoryStimulation ?? 0;
    if (s.marketingSummary.available && campEff < 0.38 && terrStim > 0.35) {
      signals.push({
        id: "pred-campaign-fatigue",
        kind: "campaign_fatigue",
        confidence: Number(Math.min(0.85, 0.4 + terrStim * 0.35 + (1 - campEff) * 0.3).toFixed(3)),
        timeHorizon: "72h",
        predictionBasis: "High territory stimulation with declining campaign effectiveness on marketing adapter slice.",
        sourceSignals: ["marketingSummary.metrics.campaignEffectiveness", "marketingSummary.metrics.territoryStimulation"],
        headline: "Campaign fatigue envelope — activation surface may be over-driving territories without conversion lift.",
        riskLevel: Number(Math.min(1, terrStim * 0.55 + (1 - campEff) * 0.35).toFixed(3)),
      });
    }

    const nonTerminalShare =
      s.supply.shipments.length > 0
        ? s.supply.shipments.filter((sh) => sh.shipmentStatus !== ShipmentStatus.DELIVERED).length / s.supply.shipments.length
        : 0;
    if (nonTerminalShare > 0.35 && s.supply.orders.length > 8) {
      signals.push({
        id: "pred-distribution-slowdown",
        kind: "distribution_slowdown",
        confidence: Number(Math.min(0.86, 0.42 + nonTerminalShare * 0.35 + s.supply.orders.length * 0.006).toFixed(3)),
        timeHorizon: "72h",
        predictionBasis: "Elevated non-terminal shipment share with elevated supply order throughput.",
        sourceSignals: ["supply.shipments.shipmentStatus", "supply.orders.length"],
        headline: "Distribution slowdown — corridor motion may lag order commitments without hub re-sequencing.",
        riskLevel: Number(Math.min(1, nonTerminalShare * 0.9).toFixed(3)),
      });
    }

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "ACTIVE",
      signals: signals.slice(0, 24),
    };
  }
}
