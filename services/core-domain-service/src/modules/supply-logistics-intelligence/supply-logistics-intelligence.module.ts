import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeModule } from "../backoffice/backoffice.module";
import { DelayCongestionService } from "../delay-congestion/delay-congestion.service";
import { DeliveryRouteIntelligenceService } from "../delivery-route-intelligence/delivery-route-intelligence.service";
import { FulfillmentStabilityService } from "../fulfillment-stability/fulfillment-stability.service";
import { LoadingSupervisionService } from "../loading-supervision/loading-supervision.service";
import { ShipmentHealthService } from "../shipment-health/shipment-health.service";
import { SupplyInterventionsService } from "../supply-interventions/supply-interventions.service";
import { SupplyRiskService } from "../supply-risk/supply-risk.service";
import { TerritoryFlowService } from "../territory-flow/territory-flow.service";
import { WarehousePressureService } from "../warehouse-pressure/warehouse-pressure.service";
import { ShipmentOutboundSyncService } from "./shipment-outbound-sync.service";
import { SupplyLogisticsBriefingService } from "./supply-logistics-briefing.service";
import { SupplyLogisticsBundleService } from "./supply-logistics-bundle.service";
import { SupplyLogisticsController } from "./supply-logistics.controller";
import { SupplyLogisticsDataService } from "./supply-logistics-data.service";
import { SupplyLogisticsRealtimePublishService } from "./supply-logistics-realtime-publish.service";
import { SupplyOverviewService } from "./supply-overview.service";

@Module({
  exports: [SupplyLogisticsDataService],
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, BackofficeModule],
  controllers: [SupplyLogisticsController],
  providers: [
    ShipmentOutboundSyncService,
    SupplyLogisticsDataService,
    SupplyOverviewService,
    TerritoryFlowService,
    ShipmentHealthService,
    DeliveryRouteIntelligenceService,
    WarehousePressureService,
    LoadingSupervisionService,
    DelayCongestionService,
    FulfillmentStabilityService,
    SupplyRiskService,
    SupplyInterventionsService,
    SupplyLogisticsBriefingService,
    SupplyLogisticsBundleService,
    SupplyLogisticsRealtimePublishService,
  ],
})
export class SupplyLogisticsIntelligenceModule {}
