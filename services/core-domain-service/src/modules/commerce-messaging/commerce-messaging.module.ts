import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { RelationalNegotiationDraftModule } from "../relational-negotiation/relational-negotiation-draft.module";
import { NegotiationEngineController } from "../negotiation-engine/negotiation-engine.controller";
import { NegotiationEngineService } from "../negotiation-engine/negotiation-engine.service";
import { NegotiationToCartConverterService } from "../negotiation-engine/negotiation-to-cart-converter.service";
import { OfflineMessageSyncController } from "../offline-message-sync/offline-message-sync.controller";
import { OfflineMessageSyncService } from "../offline-message-sync/offline-message-sync.service";
import { CommerceMessagingController } from "./commerce-messaging.controller";
import { CommerceMessagingService } from "./commerce-messaging.service";
import { InternalCommerceThreadWsController } from "./internal-commerce-thread-ws.controller";
import { MockConversationInsightService } from "./mock-conversation-insight.service";
import { CommercialTrustModule } from "../commercial-trust/commercial-trust.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";

@Module({
  imports: [
    PrismaModule,
    RelationalNegotiationDraftModule,
    CommerceThreadAccessModule,
    CommercialTrustModule,
    RelationshipGovernanceModule,
  ],
  controllers: [
    CommerceMessagingController,
    InternalCommerceThreadWsController,
    NegotiationEngineController,
    OfflineMessageSyncController,
  ],
  providers: [
    CommerceMessagingService,
    MockConversationInsightService,
    NegotiationEngineService,
    NegotiationToCartConverterService,
    OfflineMessageSyncService,
  ],
})
export class CommerceMessagingModule {}
