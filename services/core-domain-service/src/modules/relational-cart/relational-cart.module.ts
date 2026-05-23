import { Global, Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { CommercialTrustModule } from "../commercial-trust/commercial-trust.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalCartConversionService } from "./relational-cart-conversion.service";
import { RelationalCartController } from "./relational-cart.controller";
import { RelationalCartDirectCatalogGuard } from "./relational-cart-direct-catalog.guard";
import { RelationalCartFromNegotiationGuard } from "./relational-cart-from-negotiation.guard";
import { RelationalCartParticipantGuard } from "./relational-cart-participant.guard";
import { RelationalCartPolicyService } from "./relational-cart-policy.service";
import { RelationalCartRealtimePublishService } from "./relational-cart-realtime-publish.service";
import { RelationalCartService } from "./relational-cart.service";

@Global()
@Module({
  imports: [
    PrismaModule,
    PlatformAuthzModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    CommercialTrustModule,
    DomainRealtimeModule,
    FeatureFlagsModule,
  ],
  controllers: [RelationalCartController],
  providers: [
    RelationalCartPolicyService,
    RelationalCartRealtimePublishService,
    RelationalCartService,
    RelationalCartConversionService,
    RelationalCartParticipantGuard,
    RelationalCartFromNegotiationGuard,
    RelationalCartDirectCatalogGuard,
  ],
  exports: [RelationalCartService, RelationalCartConversionService, RelationalCartPolicyService],
})
export class RelationalCartModule {}
