import { Injectable } from "@nestjs/common";
import type {
  CollectionPrioritiesResponse,
  CreditRiskMatrixResponse,
  FinanceOverviewResponse,
  FinancialInterventionsResponse,
  PaymentPressureRadarResponse,
  WalletLiquiditySurfaceResponse,
} from "@venext/shared-contracts";

import {
  rankInterventionBySignalScore,
  signalStrengthScoreFromCount,
  territoryFactorFromCount,
  urgencyScoreFrom01,
} from "../intervention-ranking/intervention-signal-ranking.util";

type Pack = {
  organizationId: string;
  generatedAt: string;
  overview: FinanceOverviewResponse;
  paymentPressure: PaymentPressureRadarResponse;
  creditRisk: CreditRiskMatrixResponse;
  wallet: WalletLiquiditySurfaceResponse;
  priorities: CollectionPrioritiesResponse;
};

@Injectable()
export class FinancialInterventionsService {
  synthesize(p: Pack): FinancialInterventionsResponse {
    if (p.overview.policy === "DISABLED") {
      return { version: "1", generatedAt: p.generatedAt, organizationId: p.organizationId, interventions: [] };
    }

    const territories = new Set<string>();
    for (const t of p.paymentPressure.overdueTerritories) territories.add(t.territoryCode);
    for (const i of p.priorities.items.slice(0, 6)) territories.add(i.territoryCode);

    const interventions: FinancialInterventionsResponse["interventions"] = [];

    const push = (
      id: string,
      kind: (typeof interventions)[0]["kind"],
      headline: string,
      urgency: number,
      expectedImpact: number,
      confidence: number,
      relatedSignals: string[],
    ) => {
      const u01 = Math.min(1, urgency);
      const impact01 = Math.min(1, expectedImpact);
      const conf01 = Math.min(1, confidence);
      const aff = [...territories].slice(0, 6);
      const ranked = rankInterventionBySignalScore({
        urgencyScore: urgencyScoreFrom01(u01),
        impactScore: impact01,
        confidenceScore: conf01,
        signalStrengthScore: signalStrengthScoreFromCount(relatedSignals.length, 6),
        territoryFactor: territoryFactorFromCount(aff.length, 6),
      });
      interventions.push({
        id,
        kind,
        urgency: u01,
        expectedImpact: impact01,
        confidence: conf01,
        affectedTerritories: aff,
        relatedSignals,
        finalScore: ranked.finalScore,
        headline,
      });
    };

    if (p.overview.receivablesPressure > 0.42) {
      push(
        "int-prio-col",
        "PRIORITIZE_COLLECTION",
        "Elevate collection cadence on highest receivable pressure corridors.",
        p.overview.receivablesPressure,
        0.72,
        0.64,
        [`receivablesPressure:${p.overview.receivablesPressure.toFixed(2)}`],
      );
    }

    if (p.wallet.liquidityStressIndex > 0.45) {
      push(
        "int-liq",
        "STABILIZE_LIQUIDITY",
        "Treasury lane stress — sequence inflows before discretionary downstream credit.",
        p.wallet.liquidityStressIndex,
        0.68,
        0.58,
        [`liquidityStressIndex:${p.wallet.liquidityStressIndex.toFixed(2)}`, `providerMode:${p.wallet.providerMode}`],
      );
    }

    if (p.creditRisk.exposureConcentration > 0.32) {
      push(
        "int-exp",
        "REDUCE_EXPOSURE",
        "Concentration risk on single downstream mass — diversify settlement timing.",
        p.creditRisk.exposureConcentration,
        0.7,
        0.6,
        [`exposureConcentration:${p.creditRisk.exposureConcentration.toFixed(2)}`],
      );
    }

    if (p.overview.unstableAccounts >= 2) {
      push(
        "int-strat",
        "REINFORCE_STRATEGIC_ACCOUNT",
        "Unstable account cluster — assign strategic account supervision on top buyers.",
        0.62,
        0.55,
        0.57,
        [`unstableAccounts:${p.overview.unstableAccounts}`],
      );
    }

    if (p.paymentPressure.collectionCollapseRisk > 0.38) {
      push(
        "int-collapse",
        "REDUCE_PAYMENT_COLLAPSE_RISK",
        "Payment concentration threatens collapse cascade — throttle credit pushes.",
        p.paymentPressure.collectionCollapseRisk,
        0.74,
        0.61,
        [`collectionCollapseRisk:${p.paymentPressure.collectionCollapseRisk.toFixed(2)}`],
      );
    }

    push(
      "int-accel",
      "ACCELERATE_SETTLEMENT",
      "Accelerate settlement proofing on electronic rails for open receivables.",
      0.55,
      0.52,
      0.54,
      [`paymentExecutionConfidence:${p.overview.paymentExecutionConfidence.toFixed(2)}`],
    );

    if (p.creditRisk.downstreamSolvencyRisk > 0.48) {
      push(
        "int-credit-cap",
        "RESTRICT_CREDIT_EXPOSURE",
        "Downstream solvency field degraded — cap incremental credit until stabilization.",
        p.creditRisk.downstreamSolvencyRisk,
        0.66,
        0.59,
        [`downstreamSolvencyRisk:${p.creditRisk.downstreamSolvencyRisk.toFixed(2)}`],
      );
    }

    if (p.paymentPressure.unstableBuyers.length > 0) {
      push(
        "int-monitor",
        "MONITOR_UNSTABLE_PAYER",
        "Instability trace on payer cohort — tighten observation and proof discipline.",
        0.58,
        0.48,
        0.56,
        p.paymentPressure.unstableBuyers.slice(0, 3).map((b) => `buyer:${b.buyerOrganizationId}`),
      );
    }

    interventions.sort((a, b) => b.finalScore - a.finalScore);

    return {
      version: "1",
      generatedAt: p.generatedAt,
      organizationId: p.organizationId,
      interventions: interventions.slice(0, 12),
    };
  }
}
