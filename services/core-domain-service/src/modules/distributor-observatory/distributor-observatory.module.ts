import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { DistributorObservatoryService } from "./distributor-observatory.service";

@Module({
  imports: [PrismaModule],
  providers: [DistributorObservatoryService],
  exports: [DistributorObservatoryService],
})
export class DistributorObservatoryModule {}
