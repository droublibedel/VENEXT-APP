import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { GeoSignalsModule } from "./geo/geo-signals.module";

@Module({
  imports: [GeoSignalsModule],
  controllers: [HealthController],
})
export class AppModule {}
