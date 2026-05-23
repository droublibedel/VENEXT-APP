import { Injectable } from "@nestjs/common";
import { PaymentStatus, ShipmentStatus } from "@prisma/client";
import type { PropagationImpact } from "@venext/shared-contracts";
import { rankInterventionBySignalScore, urgencyScoreFrom01 } from "../intervention-ranking/intervention-signal-ranking.util";
import type { EconomicPropagationSnapshot } from "./economic-propagation-engine.service";

export type CrossPoleMitigationRow = {
  direction: string;
  rationale: string;
  score: number;
};

/**
 * Instruction 18.1 — explainable cross-pole amplification (no duplicated pole engines; uses snapshot fields only).
 */
@Injectable()
export class CrossPoleImpactService {
  /** Amplify impact intensity toward 1.0 using correlated ADV / receivable / graph truncation (capped at 1). */
  amplifiedIntensity(snap: EconomicPropagationSnapshot, baseIntensity: number): number {
    const advMass = Math.min(1, snap.orderAdv.orders.length / 120);
    const unpaidShare =
      snap.finance.orders.length > 0
        ? snap.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID).length / snap.finance.orders.length
        : 0;
    const amp = 1 + advMass * 0.12 + unpaidShare * 0.18 + (snap.graphTraversal.truncated ? 0.05 : 0);
    return Number(Math.min(1, baseIntensity * amp).toFixed(3));
  }

  impactedPolesFrom(impacts: PropagationImpact[]): string[] {
    return [...new Set(impacts.map((i) => i.targetPole))];
  }

  mitigationDirections(snap: EconomicPropagationSnapshot, impacts: PropagationImpact[]): CrossPoleMitigationRow[] {
    const unpaid =
      snap.finance.orders.length > 0
        ? snap.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID).length / snap.finance.orders.length
        : 0;
    const delayed = snap.supply.shipments.filter((s) => s.shipmentStatus === ShipmentStatus.DELAYED).length;
    const rows: CrossPoleMitigationRow[] = [
      {
        direction: "sequence_supply_before_adv_proof",
        rationale: `Correlate hub motion (${delayed} delayed) before widening ADV proof windows.`,
        score: rankInterventionBySignalScore({
          urgencyScore: urgencyScoreFrom01(Math.min(1, delayed * 0.08 + 0.2)),
          impactScore: Math.min(1, impacts.length * 0.08 + 0.25),
          confidenceScore: 0.55,
          signalStrengthScore: Math.min(1, snap.economicSignals7d / 40 + 0.2),
          territoryFactor: Math.min(1, impacts.flatMap((i) => i.affectedTerritories).length / 8 + 0.1),
        }).finalScore ?? 0,
      },
      {
        direction: "tighten_receivable_discipline",
        rationale: `Unpaid share ${unpaid.toFixed(2)} couples finance exposure to relationship trust — prioritize settlement rails.`,
        score: rankInterventionBySignalScore({
          urgencyScore: urgencyScoreFrom01(Math.min(1, unpaid * 1.05)),
          impactScore: 0.55,
          confidenceScore: 0.52,
          signalStrengthScore: Math.min(1, snap.commercial.relationships.length / 200 + 0.15),
          territoryFactor: 0.35,
        }).finalScore ?? 0,
      },
      {
        direction: "territory_supervision_burst",
        rationale: "Fragile territories inherit logistics + payment co-stress — supervision bursts reduce false confidence in activation.",
        score: rankInterventionBySignalScore({
          urgencyScore: urgencyScoreFrom01(0.38),
          impactScore: Math.min(1, snap.marketingSummary.metrics?.territoryStimulation ?? 0.2),
          confidenceScore: snap.strategicSummary.available ? snap.strategicSummary.confidence : 0.28,
          signalStrengthScore: snap.strategicSummary.available ? snap.strategicSummary.confidence : 0.25,
          territoryFactor: Math.min(1, (snap.marketingSummary.territorySignals?.length ?? 0) / 6 + 0.2),
        }).finalScore ?? 0,
      },
    ];
    return rows.sort((a, b) => b.score - a.score);
  }
}
