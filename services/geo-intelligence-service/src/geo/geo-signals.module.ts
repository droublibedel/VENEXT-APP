import { Module } from "@nestjs/common";
import { GeoSignalsController } from "./geo-signals.controller";

@Module({
  controllers: [GeoSignalsController],
})
export class GeoSignalsModule {}
