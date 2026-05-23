import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeAuditLogModule } from "../backoffice-audit-log/backoffice-audit-log.module";
import { BackofficeFeatureControlService } from "./backoffice-feature-control.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, BackofficeAuditLogModule],
  providers: [BackofficeFeatureControlService],
  exports: [BackofficeFeatureControlService],
})
export class BackofficeFeatureControlModule {}
