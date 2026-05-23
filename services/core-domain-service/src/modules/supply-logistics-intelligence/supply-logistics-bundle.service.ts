import { Injectable } from "@nestjs/common";
import type { SupplyLogisticsBundleResponse } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DelayCongestionService } from "../delay-congestion/delay-congestion.service";
import { DeliveryRouteIntelligenceService } from "../delivery-route-intelligence/delivery-route-intelligence.service";
import { FulfillmentStabilityService } from "../fulfillment-stability/fulfillment-stability.service";
import { LoadingSupervisionService } from "../loading-supervision/loading-supervision.service";
import { ShipmentHealthService } from "../shipment-health/shipment-health.service";
import { SupplyInterventionsService } from "../supply-interventions/supply-interventions.service";
import { SupplyRiskService } from "../supply-risk/supply-risk.service";
import { TerritoryFlowService } from "../territory-flow/territory-flow.service";
import { WarehousePressureService } from "../warehouse-pressure/warehouse-pressure.service";
import { SupplyLogisticsBriefingService } from "./supply-logistics-briefing.service";
import { SupplyLogisticsDataService } from "./supply-logistics-data.service";
import { SupplyLogisticsRealtimePublishService } from "./supply-logistics-realtime-publish.service";
import { SupplyOverviewService } from "./supply-overview.service";

@Injectable()
export class SupplyLogisticsBundleService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly data: SupplyLogisticsDataService,
    private readonly overviewSvc: SupplyOverviewService,
    private readonly territoryFlowSvc: TerritoryFlowService,
    private readonly shipmentHealthSvc: ShipmentHealthService,
    private readonly routesSvc: DeliveryRouteIntelligenceService,
    private readonly warehouseSvc: WarehousePressureService,
    private readonly loadingSvc: LoadingSupervisionService,
    private readonly delaySvc: DelayCongestionService,
    private readonly stabilitySvc: FulfillmentStabilityService,
    private readonly riskSvc: SupplyRiskService,
    private readonly briefingSvc: SupplyLogisticsBriefingService,
    private readonly interventionsSvc: SupplyInterventionsService,
    private readonly realtimePublish: SupplyLogisticsRealtimePublishService,
  ) {}

  async bundle(organizationId: string): Promise<SupplyLogisticsBundleResponse> {
    const snapshot = await this.data.loadSnapshot(organizationId);
    const poleOn = await this.flags.isEnabled("supply_logistics_enabled", { organizationId });
    const tfOn = poleOn && (await this.flags.isEnabled("territory_flow_enabled", { organizationId }));
    const shOn = poleOn && (await this.flags.isEnabled("shipment_health_enabled", { organizationId }));
    const whOn = poleOn && (await this.flags.isEnabled("warehouse_pressure_enabled", { organizationId }));

    const overview = this.overviewSvc.build(snapshot, poleOn);
    const territoryFlow = this.territoryFlowSvc.build(snapshot, tfOn);
    const shipmentHealth = this.shipmentHealthSvc.build(snapshot, shOn);
    const routes = this.routesSvc.build(snapshot, poleOn);
    const warehousePressure = this.warehouseSvc.build(snapshot, whOn);
    const loadingSupervision = this.loadingSvc.build(snapshot, poleOn);
    const delayRadar = this.delaySvc.build(snapshot, poleOn);
    const fulfillmentStability = this.stabilitySvc.build(snapshot, poleOn);
    const riskMatrix = this.riskSvc.build(snapshot, poleOn);

    const briefing = await this.briefingSvc.briefing(organizationId, overview, {
      delayedShipments: overview.delayedShipments,
      routeCongestionIndex: overview.routeCongestionIndex,
      unstableTerritories: overview.unstableTerritories,
    });

    const interventions =
      overview.policy === "ACTIVE"
        ? this.interventionsSvc.synthesize({
            organizationId,
            generatedAt: snapshot.generatedAt,
            overview,
            territoryFlow,
            shipmentHealth,
            routes,
            warehouse: warehousePressure,
            loading: loadingSupervision,
            delay: delayRadar,
            riskMatrix,
            fulfillmentStability,
          })
        : { generatedAt: snapshot.generatedAt, organizationId, interventions: [] };

    const packed: SupplyLogisticsBundleResponse = {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId,
      overview,
      territoryFlow,
      shipmentHealth,
      routes,
      warehousePressure,
      loadingSupervision,
      delayRadar,
      fulfillmentStability,
      riskMatrix,
      briefing,
      interventions,
    };

    void this.realtimePublish.publishDomainAnalysis(organizationId, packed);

    return packed;
  }
}
