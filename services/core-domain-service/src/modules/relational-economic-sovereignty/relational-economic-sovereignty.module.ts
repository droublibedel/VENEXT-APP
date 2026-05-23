import { forwardRef, Module } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicContinuityModule } from "../relational-economic-continuity/relational-economic-continuity.module";
import { RelationalEconomicRecoveryModule } from "../relational-economic-recovery/relational-economic-recovery.module";
import { RelationalEconomicSovereigntyAutonomyService } from "./relational-economic-sovereignty-autonomy.service";
import { RelationalEconomicSovereigntyCalibrationService } from "./relational-economic-sovereignty-calibration.service";
import { RelationalEconomicSovereigntyCaptivityService } from "./relational-economic-sovereignty-captivity.service";
import { RelationalEconomicSovereigntyDashboardService } from "./relational-economic-sovereignty-dashboard.service";
import { RelationalEconomicSovereigntyEdgeEnrichmentService } from "./relational-economic-sovereignty-edge-enrichment.service";
import { RelationalEconomicSovereigntyController } from "./relational-economic-sovereignty.controller";
import { RelationalEconomicSovereigntyCorridorContextService } from "./relational-economic-sovereignty-corridor-context.service";
import { RelationalEconomicSovereigntyDependencyService } from "./relational-economic-sovereignty-dependency.service";
import { RelationalEconomicSovereigntyExposureService } from "./relational-economic-sovereignty-exposure.service";
import { RelationalEconomicSovereigntyGuard } from "./relational-economic-sovereignty.guard";
import { RelationalEconomicSovereigntyIngestionService } from "./relational-economic-sovereignty-ingestion.service";
import { RelationalEconomicSovereigntyNodeService } from "./relational-economic-sovereignty-node.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";
import { RelationalEconomicSovereigntyRealtimeService } from "./relational-economic-sovereignty-realtime.service";
import { RelationalEconomicSovereigntyRecoveryService } from "./relational-economic-sovereignty-recovery.service";
import { RelationalEconomicSovereigntyResilienceService } from "./relational-economic-sovereignty-resilience.service";
import { RelationalEconomicSovereigntyRetentionService } from "./relational-economic-sovereignty-retention.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicContinuityModule),
    forwardRef(() => RelationalEconomicRecoveryModule),
  ],
  controllers: [RelationalEconomicSovereigntyController],
  providers: [
    RelationalEconomicSovereigntyPolicyService,
    RelationalEconomicSovereigntyCalibrationService,
    RelationalEconomicSovereigntyCorridorContextService,
    RelationalEconomicSovereigntyAutonomyService,
    RelationalEconomicSovereigntyRetentionService,
    RelationalEconomicSovereigntyEdgeEnrichmentService,
    RelationalEconomicSovereigntyDashboardService,
    RelationalEconomicSovereigntyExposureService,
    RelationalEconomicSovereigntyDependencyService,
    RelationalEconomicSovereigntyResilienceService,
    RelationalEconomicSovereigntyCaptivityService,
    RelationalEconomicSovereigntyRecoveryService,
    RelationalEconomicSovereigntyNodeService,
    RelationalEconomicSovereigntyRealtimeService,
    RelationalEconomicSovereigntyIngestionService,
    RelationalEconomicSovereigntyGuard,
  ],
  exports: [RelationalEconomicSovereigntyIngestionService],
})
export class RelationalEconomicSovereigntyModule {}
