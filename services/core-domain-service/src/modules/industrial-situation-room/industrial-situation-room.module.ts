import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { EconomicCommandModule } from "../economic-command/economic-command.module";
import { IndustrialSituationRoomController } from "./industrial-situation-room.controller";
import { IndustrialSituationRoomEngineService } from "./industrial-situation-room-engine.service";
import { IndustrialSituationRoomRealtimePublishService } from "./industrial-situation-room-realtime-publish.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, EconomicCommandModule],
  controllers: [IndustrialSituationRoomController],
  providers: [IndustrialSituationRoomEngineService, IndustrialSituationRoomRealtimePublishService],
  exports: [IndustrialSituationRoomEngineService],
})
export class IndustrialSituationRoomModule {}
