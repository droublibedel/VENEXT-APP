import { Controller, Get } from "@nestjs/common";

@Controller("v1/telemetry")
export class TelemetryController {
  @Get("health-indicators")
  indicators() {
    return {
      syncLagHistogram: "pending-prometheus",
      networkQuality: "client-reported-hints",
      auditEvents: "audit_events_table",
    };
  }
}
