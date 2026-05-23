import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeModule } from "../backoffice/backoffice.module";
import { RealtimeCommerceModule } from "../realtime-commerce/realtime-commerce.module";
import { RelationalCommerceModule } from "../relational-commerce/relational-commerce.module";
import { AdvCoordinationService } from "../adv-coordination/adv-coordination.service";
import { ConversationalCommerceService } from "../conversational-commerce/conversational-commerce.service";
import { DeliveryPriorityService } from "../delivery-priority/delivery-priority.service";
import { GroupBuyingSupervisionService } from "../group-buying-supervision/group-buying-supervision.service";
import { NegotiationIntelligenceService } from "../negotiation-intelligence/negotiation-intelligence.service";
import { OrderPressureService } from "../order-pressure/order-pressure.service";
import { OrderRiskService } from "../order-risk/order-risk.service";
import { ReservationAllocationService } from "../reservation-allocation/reservation-allocation.service";
import { TransactionInterventionsService } from "../transaction-interventions/transaction-interventions.service";
import { OrderAdvBriefingService } from "./order-adv-briefing.service";
import { OrderAdvBundleService } from "./order-adv-bundle.service";
import { OrderAdvController } from "./order-adv.controller";
import { OrderAdvDataService } from "./order-adv-data.service";
import { OrderAdvDomainRealtimeBridgeService } from "./order-adv-domain-realtime-bridge.service";
import { OrdersOverviewService } from "./orders-overview.service";

@Module({
  exports: [OrderAdvDataService],
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    BackofficeModule,
    RelationalCommerceModule,
    RealtimeCommerceModule,
  ],
  controllers: [OrderAdvController],
  providers: [
    OrderAdvDataService,
    OrdersOverviewService,
    ConversationalCommerceService,
    NegotiationIntelligenceService,
    OrderPressureService,
    GroupBuyingSupervisionService,
    ReservationAllocationService,
    DeliveryPriorityService,
    AdvCoordinationService,
    OrderRiskService,
    TransactionInterventionsService,
    OrderAdvBriefingService,
    OrderAdvBundleService,
    OrderAdvDomainRealtimeBridgeService,
  ],
})
export class OrderAdvIntelligenceModule {}
