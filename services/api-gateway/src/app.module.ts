import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { InternalOrderAdvDomainController } from "./internal-order-adv-domain.controller";
import { InternalSupplyLogisticsDomainController } from "./internal-supply-logistics-domain.controller";
import { InternalFinanceCollectionsDomainController } from "./internal-finance-collections-domain.controller";
import { InternalDataIntelligenceDomainController } from "./internal-data-intelligence-domain.controller";
import { InternalEconomicPropagationDomainController } from "./internal-economic-propagation-domain.controller";
import { InternalEconomicMemoryDomainController } from "./internal-economic-memory-domain.controller";
import { InternalEconomicScenariosDomainController } from "./internal-economic-scenarios-domain.controller";
import { InternalEconomicCoordinationDomainController } from "./internal-economic-coordination-domain.controller";
import { InternalEconomicCommandDomainController } from "./internal-economic-command-domain.controller";
import { InternalIndustrialSituationRoomDomainController } from "./internal-industrial-situation-room-domain.controller";
import { InternalIndustrialOperationalContinuityDomainController } from "./internal-industrial-operational-continuity-domain.controller";
import { InternalIndustrialEvidenceDomainController } from "./internal-industrial-evidence-domain.controller";
import { InternalCommercialRelationshipGraphDomainController } from "./internal-commercial-relationship-graph-domain.controller";
import { InternalRelationalCatalogDomainController } from "./internal-relational-catalog-domain.controller";
import { InternalRelationalOrdersDomainController } from "./internal-relational-orders-domain.controller";
import { InternalRelationalCartDomainController } from "./internal-relational-cart-domain.controller";
import { InternalCommerceNegotiationDraftDomainController } from "./internal-commerce-negotiation-draft-domain.controller";
import { InternalCommerceSponsoredDiscoveryDomainController } from "./internal-commerce-sponsored-discovery-domain.controller";
import { InternalCommercialCorridorDomainController } from "./internal-commercial-corridor-domain.controller";
import { CommerceRealtimeAuthorizationService } from "./realtime/commerce-realtime-authorization.service";
import { CommerceRealtimeGateway } from "./realtime/commerce-realtime.gateway";
import { FinancialRealtimeGateway } from "./realtime/financial-realtime.gateway";
import { RealtimeEconomicSignalGateway } from "./realtime/realtime-economic-signal.gateway";
import { SectorRealtimeIngressCoordinator } from "./realtime/sector-realtime-ingress.service";
import { CorrelationInterceptor } from "./observability/correlation.interceptor";
import { APP_INTERCEPTOR } from "@nestjs/core";

@Module({
  controllers: [
    HealthController,
    InternalOrderAdvDomainController,
    InternalSupplyLogisticsDomainController,
    InternalFinanceCollectionsDomainController,
    InternalDataIntelligenceDomainController,
    InternalEconomicPropagationDomainController,
    InternalEconomicMemoryDomainController,
    InternalEconomicScenariosDomainController,
    InternalEconomicCoordinationDomainController,
    InternalEconomicCommandDomainController,
    InternalIndustrialSituationRoomDomainController,
    InternalIndustrialOperationalContinuityDomainController,
    InternalIndustrialEvidenceDomainController,
    InternalCommercialRelationshipGraphDomainController,
    InternalRelationalCatalogDomainController,
    InternalRelationalOrdersDomainController,
    InternalRelationalCartDomainController,
    InternalCommerceNegotiationDraftDomainController,
    InternalCommerceSponsoredDiscoveryDomainController,
    InternalCommercialCorridorDomainController,
  ],
  providers: [
    RealtimeEconomicSignalGateway,
    SectorRealtimeIngressCoordinator,
    CommerceRealtimeAuthorizationService,
    CommerceRealtimeGateway,
    FinancialRealtimeGateway,
    { provide: APP_INTERCEPTOR, useClass: CorrelationInterceptor },
  ],
})
export class AppModule {}
