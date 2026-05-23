import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeDataQualityService } from "./backoffice-data-quality.service";

@Module({
  imports: [PrismaModule],
  providers: [BackofficeDataQualityService],
  exports: [BackofficeDataQualityService],
})
export class BackofficeDataQualityModule {}
