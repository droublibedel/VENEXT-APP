import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { GraphModule } from "./graph/graph.module";
import { CatalogsModule } from "./catalogs/catalogs.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { NegotiationsModule } from "./negotiations/negotiations.module";
import { MessagesModule } from "./messages/messages.module";
import { WalletsModule } from "./wallets/wallets.module";
import { FeatureFlagsModule } from "./feature-flags/feature-flags.module";
import { EconomicSignalsModule } from "./economic-signals/economic-signals.module";
import { IndustrialPolesModule } from "./industrial-poles/industrial-poles.module";
import { PolesModule } from "./modules/poles/poles.module";
import { ProductCommerceModule } from "./modules/product-commerce/product-commerce.module";
import { CommerceMessagingModule } from "./modules/commerce-messaging/commerce-messaging.module";
import { RealtimeCommerceModule } from "./modules/realtime-commerce/realtime-commerce.module";
import { WalletInfrastructureModule } from "./modules/wallet-infrastructure/wallet-infrastructure.module";
import { RelationalCommerceModule } from "./modules/relational-commerce/relational-commerce.module";
import { BackofficeModule } from "./modules/backoffice/backoffice.module";
import { StrategicIntelligenceModule } from "./modules/strategic-intelligence/strategic-intelligence.module";
import { CommercialNetworkIntelligenceModule } from "./modules/commercial-network-intelligence/commercial-network-intelligence.module";
import { MarketingActivationIntelligenceModule } from "./modules/marketing-activation-intelligence/marketing-activation-intelligence.module";
import { OrderAdvIntelligenceModule } from "./modules/order-adv-intelligence/order-adv-intelligence.module";
import { SupplyLogisticsIntelligenceModule } from "./modules/supply-logistics-intelligence/supply-logistics-intelligence.module";
import { FinanceCollectionsIntelligenceModule } from "./modules/finance-collections-intelligence/finance-collections-intelligence.module";
import { DataIntelligenceModule } from "./modules/data-intelligence/data-intelligence.module";
import { EconomicPropagationModule } from "./modules/economic-propagation/economic-propagation.module";
import { EconomicMemoryModule } from "./modules/economic-memory/economic-memory.module";
import { EconomicScenariosModule } from "./modules/economic-scenarios/economic-scenarios.module";
import { EconomicCoordinationModule } from "./modules/economic-coordination/economic-coordination.module";
import { EconomicCommandModule } from "./modules/economic-command/economic-command.module";
import { IndustrialSituationRoomModule } from "./modules/industrial-situation-room/industrial-situation-room.module";
import { IndustrialOperationalContinuityModule } from "./modules/industrial-operational-continuity/industrial-operational-continuity.module";
import { IndustrialEvidenceModule } from "./modules/industrial-evidence/industrial-evidence.module";
import { CommercialRelationshipGraphModule } from "./modules/commercial-relationship-graph/commercial-relationship-graph.module";
import { RelationalCatalogModule } from "./modules/relational-catalog/relational-catalog.module";
import { RelationalOrdersModule } from "./modules/relational-orders/relational-orders.module";
import { RelationalCartModule } from "./modules/relational-cart/relational-cart.module";
import { RelationalFulfillmentModule } from "./modules/relational-fulfillment/relational-fulfillment.module";
import { RelationalOperationalIntelligenceModule } from "./modules/relational-operational-intelligence/relational-operational-intelligence.module";
import { RelationalPredictiveRiskModule } from "./modules/relational-predictive-risk/relational-predictive-risk.module";
import { RelationalOperationalRecommendationModule } from "./modules/relational-operational-recommendation/relational-operational-recommendation.module";
import { RelationalOperationalOrchestrationModule } from "./modules/relational-operational-orchestration/relational-operational-orchestration.module";
import { RelationalOperationalSimulationModule } from "./modules/relational-operational-simulation/relational-operational-simulation.module";
import { RelationalScenarioReviewModule } from "./modules/relational-scenario-review/relational-scenario-review.module";
import { RelationalStrategicMemoryModule } from "./modules/relational-strategic-memory/relational-strategic-memory.module";
import { RelationalEconomicSignalGraphModule } from "./modules/relational-economic-signal-graph/relational-economic-signal-graph.module";
import { RelationalEconomicCommandCenterModule } from "./modules/relational-economic-command-center/relational-economic-command-center.module";
import { RelationalEconomicPressureModule } from "./modules/relational-economic-pressure/relational-economic-pressure.module";
import { RelationalGeoEconomicModule } from "./modules/relational-geo-economic/relational-geo-economic.module";
import { RelationalSectorIntelligenceModule } from "./modules/relational-sector-intelligence/relational-sector.module";
import { RelationalSupplyFlowModule } from "./modules/relational-supply-flow/relational-supply-flow.module";
import { RelationalMacroEconomicModule } from "./modules/relational-macro-economic/relational-macro-economic.module";
import { RelationalEconomicContinuityModule } from "./modules/relational-economic-continuity/relational-economic-continuity.module";
import { RelationalEconomicSovereigntyModule } from "./modules/relational-economic-sovereignty/relational-economic-sovereignty.module";
import { RelationalEconomicRecoveryModule } from "./modules/relational-economic-recovery/relational-economic-recovery.module";
import { RelationalEconomicGovernanceModule } from "./modules/relational-economic-governance/relational-economic-governance.module";
import { RelationalEconomicArbitrationModule } from "./modules/relational-economic-arbitration/relational-economic-arbitration.module";
import { RelationalEconomicStabilizationModule } from "./modules/relational-economic-stabilization/relational-economic-stabilization.module";
import { RelationalEconomicMonitoringModule } from "./modules/relational-economic-monitoring/relational-economic-monitoring.module";
import { RelationalExecutiveOrchestrationModule } from "./modules/relational-executive-orchestration/relational-executive-orchestration.module";
import { RelationalInstitutionalReportingModule } from "./modules/relational-institutional-reporting/relational-institutional-reporting.module";
import { RelationalStrategicIntelligenceModule } from "./modules/relational-strategic-intelligence/relational-strategic-intelligence.module";
import { RelationalStrategicCommandModule } from "./modules/relational-strategic-command/relational-strategic-command.module";
import { RelationalExecutiveOperationsModule } from "./modules/relational-executive-operations/relational-executive-operations.module";
import { RelationalExecutiveControlRoomModule } from "./modules/relational-executive-control-room/relational-executive-control-room.module";
import { RelationalExecutiveStrategicSynthesisModule } from "./modules/relational-executive-strategic-synthesis/relational-executive-strategic-synthesis.module";
import { RelationalGlobalExecutiveSupervisionModule } from "./modules/relational-global-executive-supervision/relational-global-executive-supervision.module";
import { RelationalStrategicObservatoryModule } from "./modules/relational-strategic-observatory/relational-strategic-observatory.module";
import { RelationalMacroObservatoryGovernanceModule } from "./modules/relational-macro-observatory-governance/relational-macro-observatory-governance.module";
import { RelationalLayerRegistryModule } from "./modules/relational-layer-registry/relational-layer-registry.module";
import { HealthController } from "./health.controller";
import { DomainRealtimeModule } from "./modules/domain-realtime/domain-realtime.module";
import { SponsoredConversationModule } from "./modules/sponsored-conversation/sponsored-conversation.module";
import { CommercialTrustModule } from "./modules/commercial-trust/commercial-trust.module";
import { CommerceFoundationPersistenceModule } from "./modules/commerce-foundation-persistence/commerce-foundation-persistence.module";
import { CommerceMarketCatalogModule } from "./modules/commerce-market-catalog/commerce-market-catalog.module";
import { EnterpriseGovernanceLiveModule } from "./modules/enterprise-governance-live/enterprise-governance-live.module";
import { WalletPlatformModule } from "./modules/wallet-platform/wallet-platform.module";

@Module({
  imports: [
    CommerceFoundationPersistenceModule,
    CommerceMarketCatalogModule,
    EnterpriseGovernanceLiveModule,
    WalletPlatformModule,
    DomainRealtimeModule,
    CommercialTrustModule,
    SponsoredConversationModule,
    PrismaModule,
    UsersModule,
    OrganizationsModule,
    GraphModule,
    CatalogsModule,
    ProductsModule,
    OrdersModule,
    NegotiationsModule,
    MessagesModule,
    WalletsModule,
    FeatureFlagsModule,
    EconomicSignalsModule,
    IndustrialPolesModule,
    PolesModule,
    ProductCommerceModule,
    CommerceMessagingModule,
    RealtimeCommerceModule,
    WalletInfrastructureModule,
    RelationalCommerceModule,
    BackofficeModule,
    StrategicIntelligenceModule,
    CommercialNetworkIntelligenceModule,
    MarketingActivationIntelligenceModule,
    OrderAdvIntelligenceModule,
    SupplyLogisticsIntelligenceModule,
    FinanceCollectionsIntelligenceModule,
    DataIntelligenceModule,
    EconomicPropagationModule,
    EconomicMemoryModule,
    EconomicScenariosModule,
    EconomicCoordinationModule,
    EconomicCommandModule,
    IndustrialSituationRoomModule,
    IndustrialOperationalContinuityModule,
    IndustrialEvidenceModule,
    CommercialRelationshipGraphModule,
    RelationalCatalogModule,
    RelationalOrdersModule,
    RelationalCartModule,
    RelationalFulfillmentModule,
    RelationalOperationalIntelligenceModule,
    RelationalPredictiveRiskModule,
    RelationalOperationalRecommendationModule,
    RelationalOperationalOrchestrationModule,
    RelationalOperationalSimulationModule,
    RelationalScenarioReviewModule,
    RelationalStrategicMemoryModule,
    RelationalEconomicSignalGraphModule,
    RelationalEconomicCommandCenterModule,
    RelationalEconomicPressureModule,
    RelationalGeoEconomicModule,
    RelationalSectorIntelligenceModule,
    RelationalSupplyFlowModule,
    RelationalMacroEconomicModule,
    RelationalEconomicContinuityModule,
    RelationalEconomicSovereigntyModule,
    RelationalEconomicRecoveryModule,
    RelationalEconomicGovernanceModule,
    RelationalEconomicArbitrationModule,
    RelationalEconomicStabilizationModule,
    RelationalEconomicMonitoringModule,
    RelationalExecutiveOrchestrationModule,
    RelationalInstitutionalReportingModule,
    RelationalStrategicIntelligenceModule,
    RelationalStrategicCommandModule,
    RelationalExecutiveOperationsModule,
    RelationalExecutiveControlRoomModule,
    RelationalExecutiveStrategicSynthesisModule,
    RelationalGlobalExecutiveSupervisionModule,
    RelationalStrategicObservatoryModule,
    RelationalMacroObservatoryGovernanceModule,
    RelationalLayerRegistryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
