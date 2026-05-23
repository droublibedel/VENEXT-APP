import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalMacroEconomicAdaptationService } from "./relational-macro-economic-adaptation.service";
import { RelationalMacroEconomicController } from "./relational-macro-economic.controller";
import { RelationalMacroEconomicCorridorContextService } from "./relational-macro-economic-corridor-context.service";
import { RelationalMacroEconomicDependencyService } from "./relational-macro-economic-dependency.service";
import { RelationalMacroEconomicFragilityService } from "./relational-macro-economic-fragility.service";
import { RelationalMacroEconomicGuard } from "./relational-macro-economic.guard";
import { RelationalMacroEconomicIngestionService } from "./relational-macro-economic-ingestion.service";
import { RelationalMacroEconomicNodeService } from "./relational-macro-economic-node.service";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";
import { RelationalMacroEconomicPressureService } from "./relational-macro-economic-pressure.service";
import { RelationalMacroEconomicPropagationService } from "./relational-macro-economic-propagation.service";
import { RelationalMacroEconomicRealtimeService } from "./relational-macro-economic-realtime.service";
import { RelationalMacroEconomicResilienceService } from "./relational-macro-economic-resilience.service";
import { RelationalEconomicContinuityModule } from "../relational-economic-continuity/relational-economic-continuity.module";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicContinuityModule),
  ],
  controllers: [RelationalMacroEconomicController],
  providers: [
    RelationalMacroEconomicPolicyService,
    RelationalMacroEconomicCorridorContextService,
    RelationalMacroEconomicResilienceService,
    RelationalMacroEconomicPressureService,
    RelationalMacroEconomicFragilityService,
    RelationalMacroEconomicDependencyService,
    RelationalMacroEconomicPropagationService,
    RelationalMacroEconomicAdaptationService,
    RelationalMacroEconomicNodeService,
    RelationalMacroEconomicRealtimeService,
    RelationalMacroEconomicIngestionService,
    RelationalMacroEconomicGuard,
  ],
  exports: [
    RelationalMacroEconomicIngestionService,
    RelationalMacroEconomicCorridorContextService,
  ],
})
export class RelationalMacroEconomicModule {}
