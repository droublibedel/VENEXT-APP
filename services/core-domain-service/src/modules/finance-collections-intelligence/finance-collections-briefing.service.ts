import { Injectable } from "@nestjs/common";
import type { FinanceCollectionsBriefingResponse, FinanceOverviewResponse } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { BackofficeAiGatewayService } from "../backoffice/backoffice-ai-gateway.service";

@Injectable()
export class FinanceCollectionsBriefingService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly gateway: BackofficeAiGatewayService,
  ) {}

  async briefing(
    organizationId: string,
    overview: FinanceOverviewResponse,
    walletLiquidityStressIndex: number,
    topPrioritySummary: string,
  ): Promise<FinanceCollectionsBriefingResponse> {
    const aiOn = await this.flags.isEnabled("finance_ai_enabled", { organizationId });
    if (!aiOn) {
      return {
        provider: "MockAIProvider",
        policy: "DISABLED",
        title: "Finance briefing gated",
        executiveSummary: "finance_ai_enabled is off — structured finance strategist briefing withheld.",
        liquidityNote: "—",
        receivablesNote: "—",
        paymentInstabilityNote: "—",
        creditExposureNote: "—",
        recommendedCollectionMoves: [],
        confidence: 0,
        dataSources: ["feature_flag:finance_ai_enabled"],
        tone: "finance_strategist",
        note: "Non-chatbot policy surface — enable finance_ai_enabled for MockAIProvider structured output.",
      };
    }

    return this.gateway.generateFinanceCollectionsBriefing({
      receivablesPressure: overview.receivablesPressure,
      overduePressure: overview.overduePressure,
      paymentReliability: overview.paymentReliability,
      creditExposure: overview.creditExposure,
      financialInstability: overview.financialInstability,
      walletLiquidityState: overview.walletLiquidityState,
      liquidityStressIndex: walletLiquidityStressIndex,
      topPrioritySummary,
      dataSources: [
        "finance_overview",
        "payment_pressure",
        "receivables_health",
        "wallet_liquidity",
        "credit_risk",
        "collection_priorities",
      ],
    });
  }
}
