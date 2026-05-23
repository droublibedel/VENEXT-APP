import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { RelationalCommerceModule } from "../relational-commerce/relational-commerce.module";
import { BackofficeAuditLogModule } from "../backoffice-audit-log/backoffice-audit-log.module";
import { BackofficeFeatureControlModule } from "../backoffice-feature-control/backoffice-feature-control.module";
import { BackofficeEcosystemModule } from "../backoffice-ecosystem/backoffice-ecosystem.module";
import { BackofficeGraphSupervisionModule } from "../backoffice-graph-supervision/backoffice-graph-supervision.module";
import { BackofficeSignalMonitoringModule } from "../backoffice-signal-monitoring/backoffice-signal-monitoring.module";
import { BackofficeDataQualityModule } from "../backoffice-data-quality/backoffice-data-quality.module";
import { BackofficeGovernanceGuard } from "./guards/backoffice-governance.guard";
import { BackofficeCommandCenterService } from "./backoffice-command-center.service";
import { BackofficeSponsoredGovernanceService } from "./backoffice-sponsored-governance.service";
import { BackofficeAiGatewayService } from "./backoffice-ai-gateway.service";
import { BackofficeOperationalReadoutsService } from "./backoffice-operational-readouts.service";
import { BackofficeController } from "./backoffice.controller";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    RelationalCommerceModule,
    BackofficeAuditLogModule,
    BackofficeFeatureControlModule,
    BackofficeEcosystemModule,
    BackofficeGraphSupervisionModule,
    BackofficeSignalMonitoringModule,
    BackofficeDataQualityModule,
  ],
  controllers: [BackofficeController],
  providers: [
    BackofficeGovernanceGuard,
    BackofficeCommandCenterService,
    BackofficeSponsoredGovernanceService,
    BackofficeAiGatewayService,
    BackofficeOperationalReadoutsService,
  ],
  exports: [BackofficeAiGatewayService],
})
export class BackofficeModule {}
