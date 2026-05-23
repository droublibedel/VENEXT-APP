import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeModule } from "../backoffice/backoffice.module";
import { CommercialNetworkIntelligenceModule } from "../commercial-network-intelligence/commercial-network-intelligence.module";
import { FinanceCollectionsIntelligenceModule } from "../finance-collections-intelligence/finance-collections-intelligence.module";
import { MarketingActivationIntelligenceModule } from "../marketing-activation-intelligence/marketing-activation-intelligence.module";
import { OrderAdvIntelligenceModule } from "../order-adv-intelligence/order-adv-intelligence.module";
import { RelationalCommerceModule } from "../relational-commerce/relational-commerce.module";
import { StrategicIntelligenceModule } from "../strategic-intelligence/strategic-intelligence.module";
import { SupplyLogisticsIntelligenceModule } from "../supply-logistics-intelligence/supply-logistics-intelligence.module";
import { MarketingActivationSummaryAdapter } from "./adapters/marketing-activation-summary.adapter";
import { StrategicIntelligenceSummaryAdapter } from "./adapters/strategic-intelligence-summary.adapter";
import { AnomalyIntelligenceService } from "./anomaly-intelligence/anomaly-intelligence.service";
import { CrossPoleCorrelationService } from "./cross-pole-correlation/cross-pole-correlation.service";
import { DataIntelligenceBriefingService } from "./data-intelligence-briefing.service";
import { DataIntelligenceBundleService } from "./data-intelligence-bundle.service";
import { DataIntelligenceController } from "./data-intelligence.controller";
import { DataIntelligenceDataService } from "./data-intelligence-data.service";
import { DataIntelligenceRealtimePublishService } from "./data-intelligence-realtime-publish.service";
import { DataQualityIntelligenceService } from "./data-quality-intelligence/data-quality-intelligence.service";
import { DecisionSimulationService } from "./decision-simulation/decision-simulation.service";
import { EconomicOntologyService } from "./economic-ontology/economic-ontology.service";
import { EconomicScoreService } from "./economic-score/economic-score.service";
import { GraphIntelligenceService } from "./graph-intelligence/graph-intelligence.service";
import { IntelligenceInterventionsService } from "./intelligence-interventions/intelligence-interventions.service";
import { PredictiveSignalsService } from "./predictive-signals/predictive-signals.service";
import { TerritoryIntelligenceService } from "./territory-intelligence/territory-intelligence.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    BackofficeModule,
    RelationalCommerceModule,
    StrategicIntelligenceModule,
    MarketingActivationIntelligenceModule,
    CommercialNetworkIntelligenceModule,
    FinanceCollectionsIntelligenceModule,
    OrderAdvIntelligenceModule,
    SupplyLogisticsIntelligenceModule,
  ],
  controllers: [DataIntelligenceController],
  providers: [
    StrategicIntelligenceSummaryAdapter,
    MarketingActivationSummaryAdapter,
    DataIntelligenceDataService,
    EconomicOntologyService,
    CrossPoleCorrelationService,
    AnomalyIntelligenceService,
    PredictiveSignalsService,
    TerritoryIntelligenceService,
    GraphIntelligenceService,
    DecisionSimulationService,
    EconomicScoreService,
    DataQualityIntelligenceService,
    IntelligenceInterventionsService,
    DataIntelligenceBriefingService,
    DataIntelligenceBundleService,
    DataIntelligenceRealtimePublishService,
  ],
  exports: [DataIntelligenceDataService, DataIntelligenceBundleService],
})
export class DataIntelligenceModule {}
