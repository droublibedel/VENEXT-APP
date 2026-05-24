import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalExecutiveStrategicSynthesisModule } from "../relational-executive-strategic-synthesis/relational-executive-strategic-synthesis.module";
import { RelationalStrategicObservatoryModule } from "../relational-strategic-observatory/relational-strategic-observatory.module";
import { RelationalGlobalExecutiveSupervisionController } from "./relational-global-executive-supervision.controller";
import { RelationalGlobalExecutiveSupervisionBalanceService } from "./relational-global-executive-supervision-balance.service";
import { RelationalGlobalExecutiveSupervisionCorridorContextService } from "./relational-global-executive-supervision-corridor-context.service";
import { RelationalGlobalExecutiveSupervisionEngineService } from "./relational-global-executive-supervision-engine.service";
import { RelationalGlobalExecutiveSupervisionMatrixService } from "./relational-global-executive-supervision-matrix.service";
import { RelationalGlobalExecutiveSupervisionGuard } from "./relational-global-executive-supervision.guard";
import { RelationalGlobalExecutiveSupervisionIngestionService } from "./relational-global-executive-supervision-ingestion.service";
import { RelationalGlobalExecutiveSupervisionPolicyService } from "./relational-global-executive-supervision-policy.service";
import { RelationalGlobalExecutiveSupervisionPriorityService } from "./relational-global-executive-supervision-priority.service";
import { RelationalGlobalExecutiveSupervisionRealtimeService } from "./relational-global-executive-supervision-realtime.service";
import { RelationalGlobalExecutiveSupervisionRiskService } from "./relational-global-executive-supervision-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalExecutiveStrategicSynthesisModule),
    forwardRef(() => RelationalStrategicObservatoryModule),
  ],
  controllers: [RelationalGlobalExecutiveSupervisionController],
  providers: [
    RelationalGlobalExecutiveSupervisionPolicyService,
    RelationalGlobalExecutiveSupervisionCorridorContextService,
    RelationalGlobalExecutiveSupervisionEngineService,
    RelationalGlobalExecutiveSupervisionMatrixService,
    RelationalGlobalExecutiveSupervisionPriorityService,
    RelationalGlobalExecutiveSupervisionRiskService,
    RelationalGlobalExecutiveSupervisionBalanceService,
    RelationalGlobalExecutiveSupervisionRealtimeService,
    RelationalGlobalExecutiveSupervisionIngestionService,
    RelationalGlobalExecutiveSupervisionGuard,
  ],
  exports: [
    RelationalGlobalExecutiveSupervisionIngestionService,
    RelationalGlobalExecutiveSupervisionCorridorContextService,
  ],
})
export class RelationalGlobalExecutiveSupervisionModule {}
