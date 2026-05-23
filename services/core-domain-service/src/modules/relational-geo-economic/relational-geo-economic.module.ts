import { Module, forwardRef } from "@nestjs/common";

import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadAccessModule } from "../commerce-thread-access/commerce-thread-access.module";
import { DomainRealtimeModule } from "../domain-realtime/domain-realtime.module";
import { RelationalEconomicPressureModule } from "../relational-economic-pressure/relational-economic-pressure.module";
import { RelationalSectorIntelligenceModule } from "../relational-sector-intelligence/relational-sector.module";
import { RelationshipGovernanceModule } from "../relationship-governance/relationship-governance.module";
import { RelationalGeoEconomicController } from "./relational-geo-economic.controller";
import { RelationalGeoEconomicDensityService } from "./relational-geo-economic-density.service";
import { RelationalGeoEconomicExpansionService } from "./relational-geo-economic-expansion.service";
import { RelationalGeoEconomicGuard } from "./relational-geo-economic.guard";
import { RelationalGeoEconomicIngestionService } from "./relational-geo-economic-ingestion.service";
import { RelationalGeoEconomicPolicyService } from "./relational-geo-economic-policy.service";
import { RelationalGeoEconomicPressureService } from "./relational-geo-economic-pressure.service";
import { RelationalGeoEconomicPropagationService } from "./relational-geo-economic-propagation.service";
import { RelationalGeoEconomicRealtimeService } from "./relational-geo-economic-realtime.service";
import { RelationalGeoEconomicZoneService } from "./relational-geo-economic-zone.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    DomainRealtimeModule,
    CommerceThreadAccessModule,
    RelationshipGovernanceModule,
    forwardRef(() => RelationalEconomicPressureModule),
    forwardRef(() => RelationalSectorIntelligenceModule),
  ],
  controllers: [RelationalGeoEconomicController],
  providers: [
    RelationalGeoEconomicPolicyService,
    RelationalGeoEconomicZoneService,
    RelationalGeoEconomicDensityService,
    RelationalGeoEconomicPressureService,
    RelationalGeoEconomicPropagationService,
    RelationalGeoEconomicExpansionService,
    RelationalGeoEconomicRealtimeService,
    RelationalGeoEconomicIngestionService,
    RelationalGeoEconomicGuard,
  ],
  exports: [RelationalGeoEconomicIngestionService],
})
export class RelationalGeoEconomicModule {}
