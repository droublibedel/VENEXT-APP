import { Injectable } from "@nestjs/common";
import type { ExternalSignalConnector } from "./external-signal-connector.interface";
import type {
  ExternalSignalFetchContext,
  ExternalSignalSnapshot,
} from "./external-signal.types";
import { CalendarStubConnector } from "./connectors/calendar-stub.connector";
import { GeopoliticalStubConnector } from "./connectors/geopolitical-stub.connector";
import { InternetTrendStubConnector } from "./connectors/internet-trend-stub.connector";
import { PublicHolidayStubConnector } from "./connectors/public-holiday-stub.connector";
import { RamadanStubConnector } from "./connectors/ramadan-stub.connector";
import { TrafficStubConnector } from "./connectors/traffic-stub.connector";
import { WeatherStubConnector } from "./connectors/weather-stub.connector";

@Injectable()
export class ExternalSignalRegistryService {
  private readonly connectors: ExternalSignalConnector[];

  constructor(
    weather: WeatherStubConnector,
    calendar: CalendarStubConnector,
    ramadan: RamadanStubConnector,
    publicHoliday: PublicHolidayStubConnector,
    traffic: TrafficStubConnector,
    geopolitical: GeopoliticalStubConnector,
    internetTrend: InternetTrendStubConnector,
  ) {
    this.connectors = [
      weather,
      calendar,
      ramadan,
      publicHoliday,
      traffic,
      geopolitical,
      internetTrend,
    ];
  }

  listConnectors(): { id: string; kind: string }[] {
    return this.connectors.map((c) => ({ id: c.id, kind: c.kind }));
  }

  async fetchAll(ctx: ExternalSignalFetchContext): Promise<ExternalSignalSnapshot[]> {
    const chunks = await Promise.all(
      this.connectors.map((c) => c.fetch(ctx).catch(() => [] as ExternalSignalSnapshot[])),
    );
    return chunks.flat();
  }
}
