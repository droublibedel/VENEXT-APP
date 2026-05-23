import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { EconomicSignalSource, EconomicSignalType } from "@prisma/client";
import { EconomicSignalsService } from "./economic-signals.service";

@Controller("economic-signals")
export class EconomicSignalsController {
  constructor(private readonly signals: EconomicSignalsService) {}

  @Get()
  list(
    @Query("organizationId") organizationId?: string,
    @Query("productId") productId?: string,
    @Query("signalType") signalType?: EconomicSignalType,
    @Query("source") source?: EconomicSignalSource,
  ) {
    return this.signals.findAll({
      organizationId,
      productId,
      signalType,
      source,
    });
  }

  @Post("capture")
  capture(
    @Body()
    body: {
      signalType: EconomicSignalType;
      source: EconomicSignalSource;
      intensityScore: number;
      productId?: string;
      organizationId?: string;
      zoneCode?: string;
      metadata?: object;
    },
  ) {
    return this.signals.capture(body);
  }
}
