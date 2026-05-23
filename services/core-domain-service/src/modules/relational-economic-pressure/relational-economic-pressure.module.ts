import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationalGeoEconomicModule } from "../relational-geo-economic/relational-geo-economic.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalEconomicContagionService } from "./relational-economic-contagion.service";
import { RelationalEconomicDependencyService } from "./relational-economic-dependency.service";
import { RelationalEconomicFragilityService } from "./relational-economic-fragility.service";
import { RelationalEconomicPressureController } from "./relational-economic-pressure.controller";
import { RelationalEconomicPressureGuard } from "./relational-economic-pressure.guard";
import { RelationalEconomicPressureIngestionService } from "./relational-economic-pressure-ingestion.service";
import { RelationalEconomicPressurePolicyService } from "./relational-economic-pressure-policy.service";
import { RelationalEconomicPressureRealtimeService } from "./relational-economic-pressure-realtime.service";
import { RelationalEconomicPressureService } from "./relational-economic-pressure.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalGeoEconomicModule),
  ],
  controllers: [RelationalEconomicPressureController],
  providers: [
    RelationalEconomicPressurePolicyService,
    RelationalEconomicDependencyService,
    RelationalEconomicContagionService,
    RelationalEconomicFragilityService,
    RelationalEconomicPressureRealtimeService,
    RelationalEconomicPressureService,
    RelationalEconomicPressureIngestionService,
    RelationalEconomicPressureGuard,
  ],
  exports: [
    RelationalEconomicPressureIngestionService,
    RelationalEconomicPressureService,
    RelationalEconomicDependencyService,
  ],
})
export class RelationalEconomicPressureModule {}
