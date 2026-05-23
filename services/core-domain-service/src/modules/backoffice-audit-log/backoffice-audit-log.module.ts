import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeAuditLogService } from "./backoffice-audit-log.service";

@Module({
  imports: [PrismaModule],
  providers: [BackofficeAuditLogService],
  exports: [BackofficeAuditLogService],
})
export class BackofficeAuditLogModule {}
