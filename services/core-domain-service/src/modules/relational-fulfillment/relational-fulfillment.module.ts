import { Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalOperationalIntelligenceModule } from "../relational-operational-intelligence/relational-operational-intelligence.module";
import { RelationalFulfillmentCoordinationController } from "./relational-fulfillment-coordination.controller";
import { RelationalFulfillmentCoordinationPolicyService } from "./relational-fulfillment-coordination-policy.service";
import { RelationalFulfillmentCoordinationRealtimeService } from "./relational-fulfillment-coordination-realtime.service";
import { RelationalFulfillmentCoordinationService } from "./relational-fulfillment-coordination.service";
import { RelationalFulfillmentController } from "./relational-fulfillment.controller";
import { RelationalFulfillmentIncidentParticipantGuard } from "./relational-fulfillment-incident-participant.guard";
import { RelationalFulfillmentParticipantGuard } from "./relational-fulfillment-participant.guard";
import { RelationalFulfillmentPolicyService } from "./relational-fulfillment-policy.service";
import { RelationalFulfillmentRealtimeService } from "./relational-fulfillment-realtime.service";
import { RelationalFulfillmentResolutionService } from "./relational-fulfillment-resolution.service";
import { RelationalFulfillmentService } from "./relational-fulfillment.service";
import { RelationalFulfillmentTaskParticipantGuard } from "./relational-fulfillment-task-participant.guard";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    RelationshipGovernanceModule,
    CommerceThreadAccessModule,
    RelationalOperationalIntelligenceModule,
  ],
  controllers: [RelationalFulfillmentController, RelationalFulfillmentCoordinationController],
  providers: [
    RelationalFulfillmentPolicyService,
    RelationalFulfillmentRealtimeService,
    RelationalFulfillmentService,
    RelationalFulfillmentResolutionService,
    RelationalFulfillmentCoordinationPolicyService,
    RelationalFulfillmentCoordinationRealtimeService,
    RelationalFulfillmentCoordinationService,
    RelationalFulfillmentParticipantGuard,
    RelationalFulfillmentIncidentParticipantGuard,
    RelationalFulfillmentTaskParticipantGuard,
  ],
  exports: [RelationalFulfillmentService, RelationalFulfillmentCoordinationService],
})
export class RelationalFulfillmentModule {}
