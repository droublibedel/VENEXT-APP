import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalStrategicObservatoryModule } from "../relational-strategic-observatory/relational-strategic-observatory.module";
import { RelationalMacroObservatoryGovernanceController } from "./relational-macro-observatory-governance.controller";
import { RelationalMacroObservatoryGovernanceBalanceService } from "./relational-macro-observatory-governance-balance.service";
import { RelationalMacroObservatoryGovernanceCorridorContextService } from "./relational-macro-observatory-governance-corridor-context.service";
import { RelationalMacroObservatoryGovernanceEngineService } from "./relational-macro-observatory-governance-engine.service";
import { RelationalMacroObservatoryGovernanceMatrixService } from "./relational-macro-observatory-governance-matrix.service";
import { RelationalMacroObservatoryGovernanceGuard } from "./relational-macro-observatory-governance.guard";
import { RelationalMacroObservatoryGovernanceIngestionService } from "./relational-macro-observatory-governance-ingestion.service";
import { RelationalMacroObservatoryGovernancePolicyService } from "./relational-macro-observatory-governance-policy.service";
import { RelationalMacroObservatoryGovernancePriorityService } from "./relational-macro-observatory-governance-priority.service";
import { RelationalMacroObservatoryGovernanceRealtimeService } from "./relational-macro-observatory-governance-realtime.service";
import { RelationalMacroObservatoryGovernanceRiskService } from "./relational-macro-observatory-governance-risk.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalStrategicObservatoryModule),
  ],
  controllers: [RelationalMacroObservatoryGovernanceController],
  providers: [
    RelationalMacroObservatoryGovernancePolicyService,
    RelationalMacroObservatoryGovernanceCorridorContextService,
    RelationalMacroObservatoryGovernanceEngineService,
    RelationalMacroObservatoryGovernanceMatrixService,
    RelationalMacroObservatoryGovernancePriorityService,
    RelationalMacroObservatoryGovernanceRiskService,
    RelationalMacroObservatoryGovernanceBalanceService,
    RelationalMacroObservatoryGovernanceRealtimeService,
    RelationalMacroObservatoryGovernanceIngestionService,
    RelationalMacroObservatoryGovernanceGuard,
  ],
  exports: [RelationalMacroObservatoryGovernanceIngestionService],
})
export class RelationalMacroObservatoryGovernanceModule {}
