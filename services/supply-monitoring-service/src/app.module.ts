import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { SupplyStreamsModule } from "./supply/supply-streams.module";

@Module({
  imports: [SupplyStreamsModule],
  controllers: [HealthController],
})
export class AppModule {}
