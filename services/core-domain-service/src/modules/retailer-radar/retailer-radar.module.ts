import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { RetailerRadarService } from "./retailer-radar.service";

@Module({
  imports: [PrismaModule],
  providers: [RetailerRadarService],
  exports: [RetailerRadarService],
})
export class RetailerRadarModule {}
