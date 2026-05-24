import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalGlobalExecutiveSupervisionModule } from "../relational-global-executive-supervision/relational-global-executive-supervision.module";
import { RelationalMacroObservatoryGovernanceModule } from "../relational-macro-observatory-governance/relational-macro-observatory-governance.module";
import { RelationalStrategicObservatoryController } from "./relational-strategic-observatory.controller";
import { RelationalStrategicObservatoryBalanceService } from "./relational-strategic-observatory-balance.service";
import { RelationalStrategicObservatoryCorridorContextService } from "./relational-strategic-observatory-corridor-context.service";
import { RelationalStrategicObservatoryEngineService } from "./relational-strategic-observatory-engine.service";
import { RelationalStrategicObservatoryGridService } from "./relational-strategic-observatory-grid.service";
import { RelationalStrategicObservatoryGuard } from "./relational-strategic-observatory.guard";
import { RelationalStrategicObservatoryIngestionService } from "./relational-strategic-observatory-ingestion.service";
import { RelationalStrategicObservatoryPolicyService } from "./relational-strategic-observatory-policy.service";
import { RelationalStrategicObservatoryPriorityService } from "./relational-strategic-observatory-priority.service";
import { RelationalStrategicObservatoryRealtimeService } from "./relational-strategic-observatory-realtime.service";
import { RelationalStrategicObservatoryRiskService } from "./relational-strategic-observatory-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalGlobalExecutiveSupervisionModule),
    forwardRef(() => RelationalMacroObservatoryGovernanceModule),
  ],
  controllers: [RelationalStrategicObservatoryController],
  providers: [
    RelationalStrategicObservatoryPolicyService,
    RelationalStrategicObservatoryCorridorContextService,
    RelationalStrategicObservatoryEngineService,
    RelationalStrategicObservatoryGridService,
    RelationalStrategicObservatoryPriorityService,
    RelationalStrategicObservatoryRiskService,
    RelationalStrategicObservatoryBalanceService,
    RelationalStrategicObservatoryRealtimeService,
    RelationalStrategicObservatoryIngestionService,
    RelationalStrategicObservatoryGuard,
  ],
  exports: [
    RelationalStrategicObservatoryIngestionService,
    RelationalStrategicObservatoryCorridorContextService,
  ],
})
export class RelationalStrategicObservatoryModule {}
