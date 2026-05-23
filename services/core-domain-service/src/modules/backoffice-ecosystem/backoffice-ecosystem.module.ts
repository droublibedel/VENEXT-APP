import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeAuditLogModule } from "../backoffice-audit-log/backoffice-audit-log.module";
import { BackofficeEcosystemService } from "./backoffice-ecosystem.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, BackofficeAuditLogModule],
  providers: [BackofficeEcosystemService],
  exports: [BackofficeEcosystemService],
})
export class BackofficeEcosystemModule {}
