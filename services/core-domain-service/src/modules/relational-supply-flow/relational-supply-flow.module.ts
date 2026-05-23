import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationalMacroEconomicModule } from "../relational-macro-economic/relational-macro-economic.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalSupplyFlowBottleneckService } from "./relational-supply-flow-bottleneck.service";
import { RelationalSupplyFlowCorridorContextService } from "./relational-supply-flow-corridor-context.service";
import { RelationalSupplyFlowController } from "./relational-supply-flow.controller";
import { RelationalSupplyFlowDependencyService } from "./relational-supply-flow-dependency.service";
import { RelationalSupplyFlowGuard } from "./relational-supply-flow.guard";
import { RelationalSupplyFlowIngestionService } from "./relational-supply-flow-ingestion.service";
import { RelationalSupplyFlowNodeService } from "./relational-supply-flow-node.service";
import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";
import { RelationalSupplyFlowPressureService } from "./relational-supply-flow-pressure.service";
import { RelationalSupplyFlowPropagationService } from "./relational-supply-flow-propagation.service";
import { RelationalSupplyFlowRealtimeService } from "./relational-supply-flow-realtime.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalMacroEconomicModule),
  ],
  controllers: [RelationalSupplyFlowController],
  providers: [
    RelationalSupplyFlowPolicyService,
    RelationalSupplyFlowCorridorContextService,
    RelationalSupplyFlowNodeService,
    RelationalSupplyFlowPressureService,
    RelationalSupplyFlowBottleneckService,
    RelationalSupplyFlowDependencyService,
    RelationalSupplyFlowPropagationService,
    RelationalSupplyFlowRealtimeService,
    RelationalSupplyFlowIngestionService,
    RelationalSupplyFlowGuard,
  ],
  exports: [RelationalSupplyFlowIngestionService],
})
export class RelationalSupplyFlowModule {}
