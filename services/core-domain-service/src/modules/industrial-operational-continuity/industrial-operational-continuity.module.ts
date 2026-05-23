import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { IndustrialSituationRoomModule } from "../industrial-situation-room/industrial-situation-room.module";
import { IndustrialOperationalContinuityController } from "./industrial-operational-continuity.controller";
import { IndustrialOperationalContinuityEngineService } from "./industrial-operational-continuity-engine.service";
import { IndustrialOperationalContinuityRealtimePublishService } from "./industrial-operational-continuity-realtime-publish.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule, IndustrialSituationRoomModule],
  controllers: [IndustrialOperationalContinuityController],
  providers: [IndustrialOperationalContinuityEngineService, IndustrialOperationalContinuityRealtimePublishService],
  exports: [IndustrialOperationalContinuityEngineService],
})
export class IndustrialOperationalContinuityModule {}
