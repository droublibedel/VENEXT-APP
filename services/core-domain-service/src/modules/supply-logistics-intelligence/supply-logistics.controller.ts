import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
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
import { SupplyLogisticsBundleService } from "./supply-logistics-bundle.service";
import { SupplyLogisticsDataService } from "./supply-logistics-data.service";
import { SupplyOverviewService } from "./supply-overview.service";

@Controller("supply-logistics")
@UseGuards(VenextAuthzGuard)
export class SupplyLogisticsController {
  constructor(
    private readonly prisma: PrismaService,
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
    private readonly bundleSvc: SupplyLogisticsBundleService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("supply_logistics_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "supply_logistics_disabled" });
    }
    await this.assertProducerScope(organizationId);
    return organizationId;
  }

  private async assertProducerScope(organizationId: string) {
    if (devAuthBypassEnabled()) return;
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { category: true, actorType: true },
    });
    if (!org) throw new ForbiddenException({ code: "organization_not_found" });
    const ok =
      org.category === OrganizationCategory.PRODUCER || org.actorType === OrganizationActorType.INDUSTRIAL_PRODUCER;
    if (!ok) throw new ForbiddenException({ code: "supply_logistics_producer_scope_required" });
  }

  private async gates(organizationId: string) {
    const poleOn = await this.flags.isEnabled("supply_logistics_enabled", { organizationId });
    const tfOn = poleOn && (await this.flags.isEnabled("territory_flow_enabled", { organizationId }));
    const shOn = poleOn && (await this.flags.isEnabled("shipment_health_enabled", { organizationId }));
    const whOn = poleOn && (await this.flags.isEnabled("warehouse_pressure_enabled", { organizationId }));
    return { poleOn, tfOn, shOn, whOn };
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return this.bundleSvc.bundle(org);
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.overviewSvc.build(snapshot, poleOn);
  }

  @Get("territory-flow")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async territoryFlow(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { tfOn } = await this.gates(org);
    return this.territoryFlowSvc.build(snapshot, tfOn);
  }

  @Get("shipment-health")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async shipmentHealth(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { shOn } = await this.gates(org);
    return this.shipmentHealthSvc.build(snapshot, shOn);
  }

  @Get("routes")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async routes(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.routesSvc.build(snapshot, poleOn);
  }

  @Get("warehouse-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async warehousePressure(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { whOn } = await this.gates(org);
    return this.warehouseSvc.build(snapshot, whOn);
  }

  @Get("loading-supervision")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async loadingSupervision(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.loadingSvc.build(snapshot, poleOn);
  }

  @Get("delay-radar")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async delayRadar(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.delaySvc.build(snapshot, poleOn);
  }

  @Get("fulfillment-stability")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async fulfillmentStability(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.stabilitySvc.build(snapshot, poleOn);
  }

  @Get("risk-matrix")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async riskMatrix(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.riskSvc.build(snapshot, poleOn);
  }

  @Get("briefing")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async briefing(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    const overview = this.overviewSvc.build(snapshot, poleOn);
    return this.briefingSvc.briefing(org, overview, {
      delayedShipments: overview.delayedShipments,
      routeCongestionIndex: overview.routeCongestionIndex,
      unstableTerritories: overview.unstableTerritories,
    });
  }

  @Get("interventions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async interventions(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const gates = await this.gates(org);
    const overview = this.overviewSvc.build(snapshot, gates.poleOn);
    if (overview.policy === "DISABLED") {
      return { generatedAt: snapshot.generatedAt, organizationId: org, interventions: [] };
    }
    const territoryFlow = this.territoryFlowSvc.build(snapshot, gates.tfOn);
    const shipmentHealth = this.shipmentHealthSvc.build(snapshot, gates.shOn);
    const routes = this.routesSvc.build(snapshot, gates.poleOn);
    const warehouse = this.warehouseSvc.build(snapshot, gates.whOn);
    const loading = this.loadingSvc.build(snapshot, gates.poleOn);
    const delay = this.delaySvc.build(snapshot, gates.poleOn);
    const riskMatrix = this.riskSvc.build(snapshot, gates.poleOn);
    const fulfillmentStability = this.stabilitySvc.build(snapshot, gates.poleOn);
    return this.interventionsSvc.synthesize({
      organizationId: org,
      generatedAt: snapshot.generatedAt,
      overview,
      territoryFlow,
      shipmentHealth,
      routes,
      warehouse,
      loading,
      delay,
      riskMatrix,
      fulfillmentStability,
    });
  }
}
