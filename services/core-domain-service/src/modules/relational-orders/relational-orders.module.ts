import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommercialRelationshipGraphModule } from "../commercial-relationship-graph/commercial-relationship-graph.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalFulfillmentModule } from "../relational-fulfillment/relational-fulfillment.module";
import { RelationalOperationalIntelligenceModule } from "../relational-operational-intelligence/relational-operational-intelligence.module";
import { RelationalOrderExecutionController } from "./relational-order-execution.controller";
import { RelationalOrderExecutionParticipantGuard } from "./relational-order-execution-participant.guard";
import { RelationalOrderExecutionPolicyService } from "./relational-order-execution-policy.service";
import { RelationalOrderExecutionRealtimeService } from "./relational-order-execution-realtime.service";
import { RelationalOrderExecutionService } from "./relational-order-execution.service";
import { RelationalOrdersAccessService } from "./relational-orders-access.service";
import { RelationalOrdersController } from "./relational-orders.controller";
import { RelationalOrdersRealtimePublishService } from "./relational-orders-realtime-publish.service";
import { RelationalOrdersStateService } from "./relational-orders-state.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    CommercialRelationshipGraphModule,
    DomainRealtimeModule,
    RelationshipGovernanceModule,
    CommerceThreadAccessModule,
    RelationalFulfillmentModule,
    RelationalOperationalIntelligenceModule,
  ],
  controllers: [RelationalOrdersController, RelationalOrderExecutionController],
  providers: [
    RelationalOrdersAccessService,
    RelationalOrdersStateService,
    RelationalOrdersRealtimePublishService,
    RelationalOrderExecutionPolicyService,
    RelationalOrderExecutionRealtimeService,
    RelationalOrderExecutionService,
    RelationalOrderExecutionParticipantGuard,
  ],
  exports: [RelationalOrdersAccessService],
})
export class RelationalOrdersModule {}
