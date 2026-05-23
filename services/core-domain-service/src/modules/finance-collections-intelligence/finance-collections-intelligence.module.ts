import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeModule } from "../backoffice/backoffice.module";
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
import { FinanceCollectionsBundleService } from "./finance-collections-bundle.service";
import { FinanceCollectionsController } from "./finance-collections.controller";
import { FinanceCollectionsDataService } from "./finance-collections-data.service";
import { FinanceCollectionsRealtimePublishService } from "./finance-collections-realtime-publish.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, BackofficeModule],
  controllers: [FinanceCollectionsController],
  exports: [FinanceCollectionsDataService],
  providers: [
    FinanceCollectionsDataService,
    FinanceOverviewService,
    PaymentPressureService,
    ReceivablesHealthService,
    PaymentBehaviorService,
    WalletLiquidityService,
    CreditRiskService,
    CashflowIntelligenceService,
    PaymentAnomaliesService,
    CollectionPrioritiesService,
    FinancialInterventionsService,
    FinanceCollectionsBriefingService,
    FinanceCollectionsBundleService,
    FinanceCollectionsRealtimePublishService,
  ],
})
export class FinanceCollectionsIntelligenceModule {}
