import { Module } from "@nestjs/common";
import { EconomicSignalsController } from "./economic-signals.controller";
import { EconomicSignalsService } from "./economic-signals.service";

@Module({
  controllers: [EconomicSignalsController],
  providers: [EconomicSignalsService],
})
export class EconomicSignalsModule {}
