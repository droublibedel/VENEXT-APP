import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeAuditLogModule } from "../backoffice-audit-log/backoffice-audit-log.module";
import { BackofficeGraphSupervisionService } from "./backoffice-graph-supervision.service";

@Module({
  imports: [PrismaModule, BackofficeAuditLogModule],
  providers: [BackofficeGraphSupervisionService],
  exports: [BackofficeGraphSupervisionService],
})
export class BackofficeGraphSupervisionModule {}
