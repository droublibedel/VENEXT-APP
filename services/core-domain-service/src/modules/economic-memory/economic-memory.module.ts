import { Module } from "@nestjs/common";
import { BackofficeModule } from "../backoffice/backoffice.module";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CrisisSignatureService } from "./crisis-signature.service";
import { EconomicMemoryController } from "./economic-memory.controller";
import { EconomicMemoryRealtimePublishService } from "./economic-memory-realtime-publish.service";
import { EconomicMemoryService } from "./economic-memory.service";
import { EconomicMemoryStorageService } from "./economic-memory-storage.service";
import { HistoricalPatternService } from "./historical-pattern.service";
import { PropagationHistoryService } from "./propagation-history.service";
import { TemporalEconomicAnalysisService } from "./temporal-economic-analysis.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, BackofficeModule],
  controllers: [EconomicMemoryController],
  providers: [
    HistoricalPatternService,
    PropagationHistoryService,
    CrisisSignatureService,
    TemporalEconomicAnalysisService,
    EconomicMemoryRealtimePublishService,
    EconomicMemoryStorageService,
    EconomicMemoryService,
  ],
  exports: [EconomicMemoryStorageService, EconomicMemoryService],
})
export class EconomicMemoryModule {}
