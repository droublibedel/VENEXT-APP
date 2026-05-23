import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalSupplyFlowModule } from "../relational-supply-flow/relational-supply-flow.module";
import { RelationalSectorController } from "./relational-sector.controller";
import { RelationalSectorDependencyService } from "./relational-sector-dependency.service";
import { RelationalSectorExpansionService } from "./relational-sector-expansion.service";
import { RelationalSectorIngestionService } from "./relational-sector-ingestion.service";
import { RelationalSectorMarketStructureService } from "./relational-sector-market-structure.service";
import { RelationalSectorPolicyService } from "./relational-sector-policy.service";
import { RelationalSectorPressureService } from "./relational-sector-pressure.service";
import { RelationalSectorPropagationService } from "./relational-sector-propagation.service";
import { RelationalSectorRealtimeService } from "./relational-sector-realtime.service";
import { RelationalSectorStreamingService } from "./relational-sector-streaming.service";
import { RelationalSectorGuard } from "./relational-sector.guard";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalSupplyFlowModule),
  ],
  controllers: [RelationalSectorController],
  providers: [
    RelationalSectorPolicyService,
    RelationalSectorMarketStructureService,
    RelationalSectorPressureService,
    RelationalSectorDependencyService,
    RelationalSectorPropagationService,
    RelationalSectorExpansionService,
    RelationalSectorRealtimeService,
    RelationalSectorStreamingService,
    RelationalSectorIngestionService,
    RelationalSectorGuard,
  ],
  exports: [RelationalSectorIngestionService],
})
export class RelationalSectorIntelligenceModule {}
