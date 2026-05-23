import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicSignalGraphModule } from "../relational-economic-signal-graph/relational-economic-signal-graph.module";
import { RelationalEconomicCommandCenterController } from "./relational-economic-command-center.controller";
import { RelationalEconomicCommandCenterIngestionService } from "./relational-economic-command-center-ingestion.service";
import { RelationalEconomicCommandCenterParticipantGuard } from "./relational-economic-command-center-participant.guard";
import { RelationalEconomicCommandCenterService } from "./relational-economic-command-center.service";
import { RelationalEconomicCommandPolicyService } from "./relational-economic-command-policy.service";
import { RelationalEconomicCommandRealtimeService } from "./relational-economic-command-realtime.service";
import { RelationalEconomicSystemicViewService } from "./relational-economic-systemic-view.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicSignalGraphModule),
  ],
  controllers: [RelationalEconomicCommandCenterController],
  providers: [
    RelationalEconomicCommandPolicyService,
    RelationalEconomicSystemicViewService,
    RelationalEconomicCommandRealtimeService,
    RelationalEconomicCommandCenterService,
    RelationalEconomicCommandCenterIngestionService,
    RelationalEconomicCommandCenterParticipantGuard,
  ],
  exports: [RelationalEconomicCommandCenterService, RelationalEconomicCommandCenterIngestionService],
})
export class RelationalEconomicCommandCenterModule {}
