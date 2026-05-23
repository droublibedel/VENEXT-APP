import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicPressureModule } from "../relational-economic-pressure/relational-economic-pressure.module";
import { RelationalEconomicCommandCenterModule } from "../relational-economic-command-center/relational-economic-command-center.module";
import { RelationalEconomicClusterService } from "./relational-economic-cluster.service";
import { RelationalEconomicCorrelationService } from "./relational-economic-correlation.service";
import { RelationalEconomicPropagationService } from "./relational-economic-propagation.service";
import { RelationalEconomicSignalGraphController } from "./relational-economic-signal-graph.controller";
import { RelationalEconomicSignalGraphIngestionService } from "./relational-economic-signal-graph-ingestion.service";
import { RelationalEconomicSignalGraphService } from "./relational-economic-signal-graph.service";
import { RelationalEconomicSignalParticipantGuard } from "./relational-economic-signal-participant.guard";
import { RelationalEconomicSignalPolicyService } from "./relational-economic-signal-policy.service";
import { RelationalEconomicSignalRealtimeService } from "./relational-economic-signal-realtime.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicCommandCenterModule),
    forwardRef(() => RelationalEconomicPressureModule),
  ],
  controllers: [RelationalEconomicSignalGraphController],
  providers: [
    RelationalEconomicSignalPolicyService,
    RelationalEconomicCorrelationService,
    RelationalEconomicPropagationService,
    RelationalEconomicClusterService,
    RelationalEconomicSignalGraphService,
    RelationalEconomicSignalRealtimeService,
    RelationalEconomicSignalGraphIngestionService,
    RelationalEconomicSignalParticipantGuard,
  ],
  exports: [
    RelationalEconomicSignalGraphService,
    RelationalEconomicSignalGraphIngestionService,
    RelationalEconomicPropagationService,
    RelationalEconomicClusterService,
  ],
})
export class RelationalEconomicSignalGraphModule {}
