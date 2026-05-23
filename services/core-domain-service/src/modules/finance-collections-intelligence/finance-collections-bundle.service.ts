import { Injectable } from "@nestjs/common";
import type { FinanceCollectionsBundleResponse } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { CashflowIntelligenceService } from "../cashflow-intelligence/cashflow-intelligence.service";
import { CollectionPrioritiesService } from "../collection-priorities/collection-priorities.service";
import { CreditRiskService } from "../credit-risk/credit-risk.service";
import { FinanceOverviewService } from "../finance-overview/finance-overview.service";
import { FinancialInterventionsService } from "../financial-interventions/financial-interventions.service";
import { PaymentAnomaliesService } from "../payment-anomalies/payment-anomalies.service";
import { PaymentBehaviorService } from "../payment-behavior/payment-behavior.service";
import { PaymentPressureService } from "../payment-pressure/payment-pressure.service";
import { ReceivablesHealthService } from "../receivables-health/receivables-health.service";
import { WalletLiquidityService } from "../wallet-liquidity/wallet-liquidity.service";
import { FinanceCollectionsBriefingService } from "./finance-collections-briefing.service";
import { FinanceCollectionsDataService } from "./finance-collections-data.service";
import { FinanceCollectionsRealtimePublishService } from "./finance-collections-realtime-publish.service";

@Injectable()
export class FinanceCollectionsBundleService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly data: FinanceCollectionsDataService,
    private readonly overviewSvc: FinanceOverviewService,
    private readonly paymentPressureSvc: PaymentPressureService,
    private readonly receivablesSvc: ReceivablesHealthService,
    private readonly behaviorSvc: PaymentBehaviorService,
    private readonly walletSvc: WalletLiquidityService,
    private readonly creditSvc: CreditRiskService,
    private readonly cashflowSvc: CashflowIntelligenceService,
    private readonly anomaliesSvc: PaymentAnomaliesService,
    private readonly prioritiesSvc: CollectionPrioritiesService,
    private readonly briefingSvc: FinanceCollectionsBriefingService,
    private readonly interventionsSvc: FinancialInterventionsService,
    private readonly realtimePublish: FinanceCollectionsRealtimePublishService,
  ) {}

  async bundle(organizationId: string): Promise<FinanceCollectionsBundleResponse> {
    const snapshot = await this.data.loadSnapshot(organizationId);
    const poleOn = await this.flags.isEnabled("finance_collections_enabled", { organizationId });
    const paymentPressureOn = poleOn && (await this.flags.isEnabled("payment_pressure_enabled", { organizationId }));
    const walletOn = poleOn && (await this.flags.isEnabled("wallet_liquidity_enabled", { organizationId }));
    const creditOn = poleOn && (await this.flags.isEnabled("credit_risk_enabled", { organizationId }));

    const overview = this.overviewSvc.build(snapshot, poleOn);
    const paymentPressure = this.paymentPressureSvc.build(snapshot, paymentPressureOn);
    const receivablesHealth = this.receivablesSvc.build(snapshot, poleOn);
    const paymentBehavior = this.behaviorSvc.build(snapshot, poleOn);
    const walletLiquidity = this.walletSvc.build(snapshot, walletOn);
    const creditRisk = this.creditSvc.build(snapshot, creditOn);
    const cashflow = this.cashflowSvc.build(snapshot, poleOn);
    const paymentAnomalies = this.anomaliesSvc.build(snapshot, poleOn);
    const collectionPriorities = this.prioritiesSvc.build(snapshot, poleOn);

    const topPrioritySummary =
      collectionPriorities.items[0] != null
        ? `Top queue: ${collectionPriorities.items[0].buyerDisplayName} · ${collectionPriorities.items[0].territoryCode} · urgency ${collectionPriorities.items[0].urgency.toFixed(2)}.`
        : "No acute queue head — maintain observatory on receivable drift.";

    const briefing = await this.briefingSvc.briefing(organizationId, overview, walletLiquidity.liquidityStressIndex, topPrioritySummary);

    const interventions =
      overview.policy === "DISABLED"
        ? { version: "1" as const, generatedAt: snapshot.generatedAt, organizationId, interventions: [] }
        : this.interventionsSvc.synthesize({
            organizationId,
            generatedAt: snapshot.generatedAt,
            overview,
            paymentPressure,
            creditRisk,
            wallet: walletLiquidity,
            priorities: collectionPriorities,
          });

    const packed: FinanceCollectionsBundleResponse = {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId,
      overview,
      paymentPressure,
      receivablesHealth,
      paymentBehavior,
      walletLiquidity,
      creditRisk,
      cashflow,
      paymentAnomalies,
      collectionPriorities,
      briefing,
      interventions,
    };

    void this.realtimePublish.publishDomainAnalysis(organizationId, packed);

    return packed;
  }
}
