import { Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommercialTrustComputationService } from "./commercial-trust-computation.service";
import { CommercialTrustController } from "./commercial-trust.controller";
import { CommercialTrustProfileAccessGuard } from "./commercial-trust-profile-access.guard";
import { CommercialTrustQueryService } from "./commercial-trust-query.service";
import { CommercialTrustRealtimePublishService } from "./commercial-trust-realtime-publish.service";
import { CommercialTrustTouchService } from "./commercial-trust-touch.service";
import { CommercialTrustVisibilityService } from "./commercial-trust-visibility.service";
import { InternalCommercialTrustController } from "./internal-commercial-trust.controller";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, DomainRealtimeModule, PlatformAuthzModule, RelationshipGovernanceModule],
  controllers: [CommercialTrustController, InternalCommercialTrustController],
  providers: [
    CommercialTrustRealtimePublishService,
    CommercialTrustComputationService,
    CommercialTrustTouchService,
    CommercialTrustVisibilityService,
    CommercialTrustQueryService,
    CommercialTrustProfileAccessGuard,
  ],
  exports: [CommercialTrustTouchService],
})
export class CommercialTrustModule {}
