import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { DeliveryStatus, NegotiationStatus, OrganizationActorType, OrganizationCategory } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { AdvCoordinationService } from "../adv-coordination/adv-coordination.service";
import { ConversationalCommerceService } from "../conversational-commerce/conversational-commerce.service";
import { DeliveryPriorityService } from "../delivery-priority/delivery-priority.service";
import { GroupBuyingSupervisionService } from "../group-buying-supervision/group-buying-supervision.service";
import { NegotiationIntelligenceService } from "../negotiation-intelligence/negotiation-intelligence.service";
import { OrderPressureService } from "../order-pressure/order-pressure.service";
import { OrderRiskService } from "../order-risk/order-risk.service";
import { ReservationAllocationService } from "../reservation-allocation/reservation-allocation.service";
import { TransactionInterventionsService } from "../transaction-interventions/transaction-interventions.service";
import { SponsoredInjectionEngineService } from "../relational-commerce/sponsored-injection-engine.service";
import { OrderAdvBriefingService } from "./order-adv-briefing.service";
import { OrderAdvBundleService } from "./order-adv-bundle.service";
import { OrderAdvDataService } from "./order-adv-data.service";
import { OrdersOverviewService } from "./orders-overview.service";

@Controller("order-adv")
@UseGuards(VenextAuthzGuard)
export class OrderAdvController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly data: OrderAdvDataService,
    private readonly overviewSvc: OrdersOverviewService,
    private readonly conversationalSvc: ConversationalCommerceService,
    private readonly negotiationSvc: NegotiationIntelligenceService,
    private readonly pressureSvc: OrderPressureService,
    private readonly groupBuyingSvc: GroupBuyingSupervisionService,
    private readonly reservationSvc: ReservationAllocationService,
    private readonly deliverySvc: DeliveryPriorityService,
    private readonly advSvc: AdvCoordinationService,
    private readonly riskSvc: OrderRiskService,
    private readonly briefingSvc: OrderAdvBriefingService,
    private readonly interventionsSvc: TransactionInterventionsService,
    private readonly bundleSvc: OrderAdvBundleService,
    private readonly sponsored: SponsoredInjectionEngineService,
  ) {}

  private async sponsoredProductIds(organizationId: string) {
    const inj = await this.sponsored.listActiveInjections({ viewerOrganizationId: organizationId, limit: 80 });
    return new Set(inj.items.map((i) => i.product.id));
  }

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("order_adv_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "order_adv_disabled" });
    }
    await this.assertProducerOrderAdvPole(organizationId);
    return organizationId;
  }

  private async assertProducerOrderAdvPole(organizationId: string) {
    if (devAuthBypassEnabled()) return;
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { category: true, actorType: true },
    });
    if (!org) throw new ForbiddenException({ code: "organization_not_found" });
    const ok =
      org.category === OrganizationCategory.PRODUCER || org.actorType === OrganizationActorType.INDUSTRIAL_PRODUCER;
    if (!ok) {
      throw new ForbiddenException({ code: "order_adv_producer_scope_required" });
    }
  }

  private async gates(organizationId: string) {
    const poleOn = await this.flags.isEnabled("order_adv_enabled", { organizationId });
    const convOn = poleOn && (await this.flags.isEnabled("conversational_commerce_enabled", { organizationId }));
    const negOn = poleOn && (await this.flags.isEnabled("negotiation_intelligence_enabled", { organizationId }));
    const gbOn = poleOn && (await this.flags.isEnabled("group_buying_enabled", { organizationId }));
    const resOn = poleOn && (await this.flags.isEnabled("reservation_allocation_enabled", { organizationId }));
    return { poleOn, convOn, negOn, gbOn, resOn };
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

  @Get("conversational-commerce")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async conversationalCommerce(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { convOn } = await this.gates(org);
    return this.conversationalSvc.build(snapshot, convOn);
  }

  @Get("negotiations")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async negotiations(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { negOn } = await this.gates(org);
    const sponsoredIds = await this.sponsoredProductIds(org);
    return this.negotiationSvc.build(snapshot, negOn, sponsoredIds);
  }

  @Get("order-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async orderPressure(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.pressureSvc.build(snapshot, poleOn);
  }

  @Get("group-buying")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async groupBuying(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { gbOn } = await this.gates(org);
    return this.groupBuyingSvc.build(snapshot, gbOn);
  }

  @Get("reservations")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async reservations(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { resOn } = await this.gates(org);
    return this.reservationSvc.build(snapshot, resOn);
  }

  @Get("delivery-priority")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async deliveryPriority(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.deliverySvc.build(snapshot, poleOn);
  }

  @Get("adv-coordination")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async advCoordination(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.advSvc.build(snapshot, poleOn);
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
    const negotiationsOpen = snapshot.negotiations.filter(
      (n) => n.status === NegotiationStatus.OPEN || n.status === NegotiationStatus.PROPOSED,
    ).length;
    const blockedDeliveries = snapshot.orders.filter((o) => o.deliveryStatus === DeliveryStatus.FAILED).length;
    return this.briefingSvc.briefing(org, { overview, negotiationsOpen, blockedDeliveries });
  }

  @Get("interventions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async interventions(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const gates = await this.gates(org);
    const { poleOn, negOn, gbOn, resOn } = gates;
    const overview = this.overviewSvc.build(snapshot, poleOn);
    if (overview.policy === "DISABLED") {
      return { generatedAt: snapshot.generatedAt, organizationId: org, interventions: [] };
    }
    const sponsoredIds = await this.sponsoredProductIds(org);
    const orderPressure = this.pressureSvc.build(snapshot, poleOn);
    const negotiations = this.negotiationSvc.build(snapshot, negOn, sponsoredIds);
    const groupBuying = this.groupBuyingSvc.build(snapshot, gbOn);
    const reservations = this.reservationSvc.build(snapshot, resOn);
    const deliveryPriority = this.deliverySvc.build(snapshot, poleOn);
    return this.interventionsSvc.synthesize({
      organizationId: org,
      generatedAt: snapshot.generatedAt,
      overview,
      orderPressure,
      negotiations,
      groupBuying,
      reservations,
      delivery: deliveryPriority,
    });
  }
}
