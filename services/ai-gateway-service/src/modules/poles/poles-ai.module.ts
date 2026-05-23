import { Module } from "@nestjs/common";
import { CalendarStubConnector } from "./external-signals/connectors/calendar-stub.connector";
import { GeopoliticalStubConnector } from "./external-signals/connectors/geopolitical-stub.connector";
import { InternetTrendStubConnector } from "./external-signals/connectors/internet-trend-stub.connector";
import { PublicHolidayStubConnector } from "./external-signals/connectors/public-holiday-stub.connector";
import { RamadanStubConnector } from "./external-signals/connectors/ramadan-stub.connector";
import { TrafficStubConnector } from "./external-signals/connectors/traffic-stub.connector";
import { WeatherStubConnector } from "./external-signals/connectors/weather-stub.connector";
import { ExternalSignalRegistryService } from "./external-signals/external-signal-registry.service";
import { MockPoleInsightGenerator } from "./mock-pole-insight-generator.service";
import { PoleAiContextService } from "./pole-ai-context.service";
import { PolesAiController } from "./poles-ai.controller";

@Module({
  controllers: [PolesAiController],
  providers: [
    PoleAiContextService,
    MockPoleInsightGenerator,
    WeatherStubConnector,
    CalendarStubConnector,
    RamadanStubConnector,
    PublicHolidayStubConnector,
    TrafficStubConnector,
    GeopoliticalStubConnector,
    InternetTrendStubConnector,
    ExternalSignalRegistryService,
  ],
})
export class PolesAiModule {}
