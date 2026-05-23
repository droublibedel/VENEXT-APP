import { Injectable } from "@nestjs/common";
import type { CoordinationConflict, CrossPolePriority, EconomicCoordinationSnapshot, EconomicPosture } from "@venext/shared-contracts";
import {
  rankInterventionBySignalScore,
  signalStrengthScoreFromCount,
  territoryFactorFromCount,
  urgencyScoreFrom01,
} from "../intervention-ranking/intervention-signal-ranking.util";

import { isFinanceShock } from "./economic-coordination-shock-taxonomy";

@Injectable()
export class CrossPolePriorityService {
  rank(snapshot: EconomicCoordinationSnapshot, posture: EconomicPosture, conflicts: CoordinationConflict[]): CrossPolePriority[] {
    const shocks = snapshot.propagationBundle.shocks;
    const financeShockHints = shocks.filter((s) => isFinanceShock(s)).length;
    const fragileN = snapshot.propagationBundle.territoryFragility.filter((t) => t.fragilityScore > 0.35).length;
    const maxConflict = conflicts.reduce((m, c) => Math.max(m, c.severity), 0);

    const candidates: Omit<CrossPolePriority, "priorityScore">[] = [
      {
        priorityId: "protect_liquidity",
        priorityReason: `Finance pressure scalar + ${financeShockHints} finance-classified propagation shock(s) — liquidity preservation as coordination anchor.`,
        sourceSignals: ["financialPressure", "posture", "conflict.severity.max", "propagation_shock.taxonomy.finance"],
        affectedPoles: ["FINANCE_COLLECTIONS"],
        urgency: snapshot.financialPressure > 0.55 ? "HIGH" : "MEDIUM",
        timeHorizon: "SHORT",
      },
      {
        priorityId: "stabilize_distribution",
        priorityReason: "Logistics pressure scalar elevated from propagation shocks — sequence distribution coherence before expansion pushes.",
        sourceSignals: ["logisticsPressure", "propagation.shockCount"],
        affectedPoles: ["SUPPLY_LOGISTICS"],
        urgency: snapshot.logisticsPressure > 0.52 ? "HIGH" : "MEDIUM",
        timeHorizon: "SHORT",
      },
      {
        priorityId: "preserve_relationship_confidence",
        priorityReason: "Relationship exposure rollup across fragile territories suggests relational arbitration first.",
        sourceSignals: ["territory.relationshipExposure", "posture.affectedTerritories"],
        affectedPoles: ["COMMERCIAL_NETWORK", "MARKETING_ACTIVATION"],
        urgency: posture.coordinationStress > 0.5 ? "HIGH" : "MEDIUM",
        timeHorizon: "MEDIUM",
      },
      {
        priorityId: "slow_acquisition_push",
        priorityReason: "Operational scenario risk high while organization shock density elevated — temper acquisition-style activation sequencing.",
        sourceSignals: ["operationalPressure", "organizationSignals"],
        affectedPoles: ["MARKETING_ACTIVATION", "ORDERS_ADV"],
        urgency: snapshot.operationalPressure > 0.58 ? "CRITICAL" : "MEDIUM",
        timeHorizon: "IMMEDIATE",
      },
      {
        priorityId: "accelerate_collections_review",
        priorityReason: "Cross-pole tension scalar + finance pressure — symbolic recouvrement sequencing review (no automated collection).",
        sourceSignals: ["coordinationStress", "financialPressure"],
        affectedPoles: ["FINANCE_COLLECTIONS"],
        urgency: maxConflict > 0.55 ? "HIGH" : "LOW",
        timeHorizon: "SHORT",
      },
      {
        priorityId: "limit_supply_overload",
        priorityReason: "Propagation shock count and logistics scalar jointly elevated — reduce parallel supply-side commitments in planning narratives.",
        sourceSignals: ["propagation.shockCount", "logisticsPressure"],
        affectedPoles: ["SUPPLY_LOGISTICS"],
        urgency: shocks.length > 6 ? "HIGH" : "LOW",
        timeHorizon: "MEDIUM",
      },
    ];

    const ranked: CrossPolePriority[] = candidates.map((c) => {
      const urgency01 =
        c.urgency === "CRITICAL" ? 1 : c.urgency === "HIGH" ? 0.72 : c.urgency === "MEDIUM" ? 0.45 : 0.22;
      const rankedInner = rankInterventionBySignalScore({
        urgencyScore: urgencyScoreFrom01(urgency01),
        impactScore: Math.min(1, snapshot.operationalPressure * 0.55 + maxConflict * 0.45),
        confidenceScore: Math.min(1, 0.42 + posture.confidence * 0.38),
        signalStrengthScore: signalStrengthScoreFromCount(shocks.length, 14),
        territoryFactor: territoryFactorFromCount(fragileN, 10),
      });
      return {
        ...c,
        priorityScore: Number(Math.min(1, rankedInner.finalScore).toFixed(4)),
      };
    });

    ranked.sort((a, b) => b.priorityScore - a.priorityScore || a.priorityId.localeCompare(b.priorityId));
    return ranked.slice(0, 8);
  }
}
