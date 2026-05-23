import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicSignalGraphModule } from "../relational-economic-signal-graph/relational-economic-signal-graph.module";
import { RelationalStrategicMemoryController } from "./relational-strategic-memory.controller";
import { RelationalStrategicMemoryIngestionService } from "./relational-strategic-memory-ingestion.service";
import { RelationalStrategicMemoryParticipantGuard } from "./relational-strategic-memory-participant.guard";
import { RelationalStrategicMemoryPolicyService } from "./relational-strategic-memory-policy.service";
import { RelationalStrategicMemoryRealtimeService } from "./relational-strategic-memory-realtime.service";
import { RelationalStrategicMemoryService } from "./relational-strategic-memory.service";

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
  controllers: [RelationalStrategicMemoryController],
  providers: [
    RelationalStrategicMemoryPolicyService,
    RelationalStrategicMemoryService,
    RelationalStrategicMemoryRealtimeService,
    RelationalStrategicMemoryIngestionService,
    RelationalStrategicMemoryParticipantGuard,
  ],
  exports: [RelationalStrategicMemoryService, RelationalStrategicMemoryIngestionService],
})
export class RelationalStrategicMemoryModule {}
