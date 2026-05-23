import { Injectable } from "@nestjs/common";
import { NegotiationStatus, PaymentStatus, ShipmentStatus } from "@prisma/client";
import type { EconomicShock, EconomicPropagationChain, PropagationImpact } from "@venext/shared-contracts";
import type { EconomicPropagationSnapshot } from "./economic-propagation-engine.service";

type RuleDef = {
  when: string;
  targetPole: string;
  impactType: string;
  propagationWeight: number;
  estimatedDelayMinutes: number;
  explain: (snap: EconomicPropagationSnapshot) => string;
};

/** Explicit cross-pole pack for any `data_intelligence_*` shock emitted from bundle anomalies (18.1A). */
const DATA_INTELLIGENCE_CROSS_POLE_RULES: RuleDef[] = [
  {
    when: "di→order_adv",
    targetPole: "order_adv",
    impactType: "signal_executability_drag",
    propagationWeight: 0.58,
    estimatedDelayMinutes: 180,
    explain: () =>
      "Intelligence anomaly couples first to ADV executability — proof windows tighten before finance sees receivable motion.",
  },
  {
    when: "di→supply",
    targetPole: "supply_logistics",
    impactType: "motion_supervision_load",
    propagationWeight: 0.52,
    estimatedDelayMinutes: 240,
    explain: () => "Observatory stress reallocates supervision load onto logistics motion sequencing — hub truth becomes contested.",
  },
  {
    when: "di→strategic_intelligence",
    targetPole: "strategic_intelligence",
    impactType: "posture_calibration_demand",
    propagationWeight: 0.46,
    estimatedDelayMinutes: 720,
    explain: () => "Cross-pole anomaly forces strategic posture calibration — expansion vs consolidation tradeoff inherits systemic weight.",
  },
];

const RULES: Record<string, RuleDef[]> = {
  shipment_delayed: [
    {
      when: "supply→adv",
      targetPole: "order_adv",
      impactType: "adv_execution_degradation",
      propagationWeight: 0.72,
      estimatedDelayMinutes: 120,
      explain: () => "Shipment delay compresses ADV proof windows — negotiation and reservation threads absorb uncertainty.",
    },
    {
      when: "adv→finance",
      targetPole: "finance_collections",
      impactType: "receivable_pressure",
      propagationWeight: 0.68,
      estimatedDelayMinutes: 360,
      explain: (s) =>
        `Non-terminal logistics share ${(s.supply.shipments.filter((sh) => sh.shipmentStatus !== ShipmentStatus.DELIVERED).length / Math.max(1, s.supply.shipments.length)).toFixed(2)} tightens settlement cadence.`,
    },
    {
      when: "finance→territory",
      targetPole: "data_intelligence",
      impactType: "territory_fragility_signal",
      propagationWeight: 0.5,
      estimatedDelayMinutes: 720,
      explain: () => "Receivable + motion coupling elevates territory fragility observatory weight on shared lattice.",
    },
  ],
  liquidity_collapse: [
    {
      when: "finance→adv",
      targetPole: "order_adv",
      impactType: "treasury_backpressure_on_adv",
      propagationWeight: 0.82,
      estimatedDelayMinutes: 45,
      explain: () =>
        "Treasury compression articulates first as ADV settlement backpressure — not an isolated finance inbox effect.",
    },
    {
      when: "finance→relationship",
      targetPole: "commercial_network",
      impactType: "trust_weakening",
      propagationWeight: 0.55,
      estimatedDelayMinutes: 1440,
      explain: () => "Liquidity shocks degrade distributor trust surfaces — relationship edges absorb reputational coupling.",
    },
    {
      when: "relationship→marketing",
      targetPole: "marketing_activation",
      impactType: "activation_slowdown",
      propagationWeight: 0.48,
      estimatedDelayMinutes: 2880,
      explain: (s) =>
        s.marketingSummary.available
          ? "Weaker trust reduces activation efficiency — marketing summary shows correlated activation velocity risk."
          : "Weaker trust reduces activation efficiency — marketing summary unavailable; treat as directional only.",
    },
  ],
  network_saturation: [
    {
      when: "network→adv",
      targetPole: "order_adv",
      impactType: "adv_pressure",
      propagationWeight: 0.62,
      estimatedDelayMinutes: 180,
      explain: () => "Graph saturation increases ADV contention on shared corridors.",
    },
    {
      when: "adv→supply",
      targetPole: "supply_logistics",
      impactType: "supply_congestion",
      propagationWeight: 0.58,
      estimatedDelayMinutes: 240,
      explain: () => "ADV mass stacks on logistics motion — hub sequencing risk rises.",
    },
    {
      when: "supply→finance",
      targetPole: "finance_collections",
      impactType: "finance_exposure",
      propagationWeight: 0.52,
      estimatedDelayMinutes: 480,
      explain: () => "Congestion elongates receivable windows — finance exposure widens on same economic field.",
    },
  ],
  campaign_overheating: [
    {
      when: "marketing→order",
      targetPole: "order_adv",
      impactType: "order_pressure",
      propagationWeight: 0.7,
      estimatedDelayMinutes: 90,
      explain: (s) =>
        `Activation stimulation ${(s.marketingSummary.metrics?.territoryStimulation ?? 0).toFixed(2)} stacks order pressure when campaigns over-drive corridors.`,
    },
    {
      when: "order→supply",
      targetPole: "supply_logistics",
      impactType: "supply_stress",
      propagationWeight: 0.66,
      estimatedDelayMinutes: 200,
      explain: () => "Order pressure propagates to supply stress — sequencing becomes systemic, not warehouse-only.",
    },
    {
      when: "supply→finance",
      targetPole: "finance_collections",
      impactType: "payment_delay_risk",
      propagationWeight: 0.54,
      estimatedDelayMinutes: 600,
      explain: () => "Motion stress couples to settlement delay risk on receivable rails.",
    },
  ],
  payment_instability: [
    {
      when: "finance→adv",
      targetPole: "order_adv",
      impactType: "adv_acceptance_risk",
      propagationWeight: 0.58,
      estimatedDelayMinutes: 240,
      explain: (s) =>
        `Unpaid ratio ${(s.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID).length / Math.max(1, s.finance.orders.length)).toFixed(2)} erodes ADV acceptance velocity.`,
    },
    {
      when: "finance→commercial",
      targetPole: "commercial_network",
      impactType: "relationship_stress",
      propagationWeight: 0.5,
      estimatedDelayMinutes: 720,
      explain: () => "Payment tails stress distributor trust — relationship supervision load rises.",
    },
    {
      when: "commercial→marketing",
      targetPole: "marketing_activation",
      impactType: "activation_efficiency_loss",
      propagationWeight: 0.42,
      estimatedDelayMinutes: 1200,
      explain: (s) =>
        s.marketingSummary.available
          ? "Trust drag reduces activation efficiency on the same producer marketing summary slice."
          : "Trust drag reduces activation efficiency — marketing summary unavailable; directional coupling only.",
    },
  ],
  territory_overheating: [
    {
      when: "finance→supply",
      targetPole: "supply_logistics",
      impactType: "corridor_overcommit",
      propagationWeight: 0.63,
      estimatedDelayMinutes: 300,
      explain: (s) =>
        `Order mass ${s.orderAdv.orders.length} with receivable heat forces logistics to absorb phantom throughput.`,
    },
    {
      when: "supply→data",
      targetPole: "data_intelligence",
      impactType: "territory_supervision_spike",
      propagationWeight: 0.48,
      estimatedDelayMinutes: 900,
      explain: () => "Territory overheating elevates observatory weight on predictive + anomaly surfaces.",
    },
    {
      when: "data→strategic_intelligence",
      targetPole: "strategic_intelligence",
      impactType: "strategic_risk_elevation",
      propagationWeight: 0.44,
      estimatedDelayMinutes: 1440,
      explain: () => "Supervision spikes propagate to strategic posture — corridor expansion decisions inherit fragility.",
    },
  ],
  distribution_fragility: [
    {
      when: "supply→marketing",
      targetPole: "marketing_activation",
      impactType: "activation_distortion",
      propagationWeight: 0.46,
      estimatedDelayMinutes: 420,
      explain: () => "Distribution motion lag distorts activation promises vs provable fulfillment.",
    },
    {
      when: "supply→finance",
      targetPole: "finance_collections",
      impactType: "settlement_lag",
      propagationWeight: 0.55,
      estimatedDelayMinutes: 540,
      explain: () => "Lag widens settlement lag risk — receivable field absorbs upstream jitter.",
    },
    {
      when: "finance→order_adv",
      targetPole: "order_adv",
      impactType: "negotiation_churn",
      propagationWeight: 0.41,
      estimatedDelayMinutes: 360,
      explain: () => "Settlement uncertainty feeds negotiation churn on ADV rails.",
    },
  ],
  relationship_fragmentation: [
    {
      when: "commercial→marketing",
      targetPole: "marketing_activation",
      impactType: "sponsorship_efficiency_drop",
      propagationWeight: 0.52,
      estimatedDelayMinutes: 600,
      explain: () => "Fragmented trust reduces sponsorship leverage — activation yield per spend falls.",
    },
    {
      when: "commercial→order_adv",
      targetPole: "order_adv",
      impactType: "conversion_drag",
      propagationWeight: 0.57,
      estimatedDelayMinutes: 240,
      explain: () => "Relationship voids create conversion drag independent of SKU supply.",
    },
    {
      when: "order_adv→finance",
      targetPole: "finance_collections",
      impactType: "counterparty_risk",
      propagationWeight: 0.49,
      estimatedDelayMinutes: 720,
      explain: () => "Counterparty risk re-enters finance collections as discipline debt, not invoice noise.",
    },
  ],
  negotiation_collapse: [
    {
      when: "order_adv→finance",
      targetPole: "finance_collections",
      impactType: "revenue_recognition_risk",
      propagationWeight: 0.6,
      estimatedDelayMinutes: 180,
      explain: (s) =>
        `Open negotiation surface ${s.orderAdv.negotiations.filter((n) => n.status === NegotiationStatus.OPEN || n.status === NegotiationStatus.PROPOSED).length} delays revenue recognition coupling.`,
    },
    {
      when: "order_adv→supply",
      targetPole: "supply_logistics",
      impactType: "allocation_uncertainty",
      propagationWeight: 0.5,
      estimatedDelayMinutes: 260,
      explain: () => "Without settled ADV, allocation uncertainty propagates to hub sequencing.",
    },
    {
      when: "order_adv→strategic_intelligence",
      targetPole: "strategic_intelligence",
      impactType: "deal_discipline_posture",
      propagationWeight: 0.44,
      estimatedDelayMinutes: 480,
      explain: () => "Negotiation collapse forces strategic deal-discipline posture — corridor expansion vs consolidation inherits ADV uncertainty.",
    },
  ],
  supply_chain_stress: [
    {
      when: "supply→order_adv",
      targetPole: "order_adv",
      impactType: "promise_gap",
      propagationWeight: 0.64,
      estimatedDelayMinutes: 150,
      explain: () => "Execution exceptions widen promise gaps on ADV commitments.",
    },
    {
      when: "supply→finance",
      targetPole: "finance_collections",
      impactType: "invoice_timing_noise",
      propagationWeight: 0.47,
      estimatedDelayMinutes: 400,
      explain: () => "Invoice timing inherits logistics noise — not a billing bug, a motion coupling.",
    },
    {
      when: "supply→data_intelligence",
      targetPole: "data_intelligence",
      impactType: "execution_anomaly_disclosure",
      propagationWeight: 0.41,
      estimatedDelayMinutes: 320,
      explain: () => "Execution stress elevates observatory anomaly disclosure load before strategic reframing.",
    },
  ],
  cashflow_pressure: [
    {
      when: "finance→supply",
      targetPole: "supply_logistics",
      impactType: "prepay_congestion",
      propagationWeight: 0.43,
      estimatedDelayMinutes: 500,
      explain: () => "Cashflow pressure pushes prepay / expedite behavior that congests hubs.",
    },
    {
      when: "finance→commercial",
      targetPole: "commercial_network",
      impactType: "credit_tightening",
      propagationWeight: 0.51,
      estimatedDelayMinutes: 960,
      explain: () => "Credit tightening on the network edge slows distributor appetite for activation bursts.",
    },
    {
      when: "finance→order_adv",
      targetPole: "order_adv",
      impactType: "advance_request_surge",
      propagationWeight: 0.46,
      estimatedDelayMinutes: 220,
      explain: () => "Cashflow gaps push advance / milestone requests back onto ADV rails — negotiation churn risk rises.",
    },
  ],
};

@Injectable()
export class PropagationRuleEngineService {
  resolveRuleDefs(shockType: string): { defs: RuleDef[]; usedDefaultRule: boolean } {
    const direct = RULES[shockType];
    if (direct) return { defs: direct, usedDefaultRule: false };
    if (shockType.startsWith("data_intelligence_")) {
      return { defs: DATA_INTELLIGENCE_CROSS_POLE_RULES, usedDefaultRule: false };
    }
    return { defs: this.defaultRules(shockType), usedDefaultRule: true };
  }

  ruleLookupMeta(shockType: string): { explicitRuleFound: boolean; usedDefaultRule: boolean } {
    const { usedDefaultRule } = this.resolveRuleDefs(shockType);
    return { explicitRuleFound: !usedDefaultRule, usedDefaultRule };
  }

  evaluateImpact(shock: EconomicShock, snap: EconomicPropagationSnapshot): PropagationImpact[] {
    const { defs } = this.resolveRuleDefs(shock.type);
    return defs.map((d) => {
      const isLoop = d.targetPole === shock.sourcePole;
      const baseExplain = d.explain(snap);
      return {
        targetPole: d.targetPole,
        impactType: isLoop ? "internal_amplification" : d.impactType,
        intensity: Number(Math.min(1, shock.systemicRisk * d.propagationWeight).toFixed(3)),
        confidence: Number(Math.min(1, shock.confidence * 0.92 + 0.05).toFixed(3)),
        estimatedDelayMinutes: d.estimatedDelayMinutes,
        affectedTerritories: shock.affectedTerritories.slice(0, 8),
        explanation: isLoop
          ? `${baseExplain} Same-pole internal amplification: bounded supervisory echo within ${shock.sourcePole} when cross-pole discharge is temporarily unavailable.`
          : baseExplain,
        selfLoop: isLoop ? true : undefined,
      };
    });
  }

  buildPropagationChain(shock: EconomicShock, snap: EconomicPropagationSnapshot): EconomicPropagationChain {
    const impacts = this.evaluateImpact(shock, snap);
    const systemicRiskScore = Number(
      Math.min(1, impacts.reduce((m, i) => Math.max(m, i.intensity), 0) * 0.85 + shock.systemicRisk * 0.15).toFixed(3),
    );
    const propagationDepth = new Set(impacts.map((i) => i.targetPole)).size;
    const recommendedInterventions = [
      `sequence_hub_before_corridor:${shock.type}`,
      `pair_proof_with_adv:${shock.sourcePole}`,
      `tighten_territory_supervision:${shock.affectedTerritories[0] ?? "multi"}`,
    ].slice(0, 6);
    return {
      chainId: `chain-${shock.id}`,
      shock,
      impacts,
      systemicRiskScore,
      propagationDepth,
      recommendedInterventions,
    };
  }

  private defaultRules(type: string): RuleDef[] {
    return [
      {
        when: "generic",
        targetPole: "data_intelligence",
        impactType: "cross_pole_echo",
        propagationWeight: 0.45,
        estimatedDelayMinutes: 360,
        explain: () => `Propagation echo for ${type} — use explicit rule pack when business thresholds expand.`,
      },
    ];
  }
}
