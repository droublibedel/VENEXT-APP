import { Injectable } from "@nestjs/common";
import type { OrderAdvBundleResponse } from "@venext/shared-contracts";
import { DeliveryStatus, NegotiationStatus } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { AdvCoordinationService } from "../adv-coordination/adv-coordination.service";
import { ConversationalCommerceService } from "../conversational-commerce/conversational-commerce.service";
import { DeliveryPriorityService } from "../delivery-priority/delivery-priority.service";
import { GroupBuyingSupervisionService } from "../group-buying-supervision/group-buying-supervision.service";
import { NegotiationIntelligenceService } from "../negotiation-intelligence/negotiation-intelligence.service";
import { OrderPressureService } from "../order-pressure/order-pressure.service";
import { OrderRiskService } from "../order-risk/order-risk.service";
import { ReservationAllocationService } from "../reservation-allocation/reservation-allocation.service";
import { SponsoredInjectionEngineService } from "../relational-commerce/sponsored-injection-engine.service";
import { TransactionInterventionsService } from "../transaction-interventions/transaction-interventions.service";
import { OrderAdvBriefingService } from "./order-adv-briefing.service";
import { OrderAdvDataService } from "./order-adv-data.service";
import { OrderAdvDomainRealtimeBridgeService } from "./order-adv-domain-realtime-bridge.service";
import { OrdersOverviewService } from "./orders-overview.service";

@Injectable()
export class OrderAdvBundleService {
  constructor(
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
    private readonly sponsored: SponsoredInjectionEngineService,
    private readonly domainBridge: OrderAdvDomainRealtimeBridgeService,
  ) {}

  async bundle(organizationId: string): Promise<OrderAdvBundleResponse> {
    const orgId = organizationId;
    const snapshot = await this.data.loadSnapshot(orgId);

    const poleOn = await this.flags.isEnabled("order_adv_enabled", { organizationId: orgId });
    const convOn = poleOn && (await this.flags.isEnabled("conversational_commerce_enabled", { organizationId: orgId }));
    const negOn = poleOn && (await this.flags.isEnabled("negotiation_intelligence_enabled", { organizationId: orgId }));
    const gbOn = poleOn && (await this.flags.isEnabled("group_buying_enabled", { organizationId: orgId }));
    const resOn = poleOn && (await this.flags.isEnabled("reservation_allocation_enabled", { organizationId: orgId }));

    const inj = await this.sponsored.listActiveInjections({ viewerOrganizationId: orgId, limit: 80 });
    const sponsoredProductIds = new Set(inj.items.map((i) => i.product.id));

    const overview = this.overviewSvc.build(snapshot, poleOn);
    const conversationalCommerce = this.conversationalSvc.build(snapshot, convOn);
    const negotiations = this.negotiationSvc.build(snapshot, negOn, sponsoredProductIds);
    const orderPressure = this.pressureSvc.build(snapshot, poleOn);
    const groupBuying = this.groupBuyingSvc.build(snapshot, gbOn);
    const reservations = this.reservationSvc.build(snapshot, resOn);
    const deliveryPriority = this.deliverySvc.build(snapshot, poleOn);
    const advCoordination = this.advSvc.build(snapshot, poleOn);
    const riskMatrix = this.riskSvc.build(snapshot, poleOn);

    const negotiationsOpen = snapshot.negotiations.filter(
      (n) => n.status === NegotiationStatus.OPEN || n.status === NegotiationStatus.PROPOSED,
    ).length;
    const blockedDeliveries = snapshot.orders.filter((o) => o.deliveryStatus === DeliveryStatus.FAILED).length;

    const briefing = await this.briefingSvc.briefing(orgId, {
      overview,
      negotiationsOpen,
      blockedDeliveries,
    });

    const interventions =
      overview.policy === "ACTIVE"
        ? this.interventionsSvc.synthesize({
            organizationId: orgId,
            generatedAt: snapshot.generatedAt,
            overview,
            orderPressure,
            negotiations,
            groupBuying,
            reservations,
            delivery: deliveryPriority,
          })
        : { generatedAt: snapshot.generatedAt, organizationId: orgId, interventions: [] };

    this.domainBridge.maybePublishAfterRead(orgId, snapshot, {
      overview,
      negotiations,
      groupBuying,
      reservations,
      delivery: deliveryPriority,
    });

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: orgId,
      overview,
      conversationalCommerce,
      negotiations,
      orderPressure,
      groupBuying,
      reservations,
      deliveryPriority,
      advCoordination,
      riskMatrix,
      briefing,
      interventions,
    };
  }
}
