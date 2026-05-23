import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return {
      service: "api-gateway",
      status: "ok",
      realtime: "ws:/realtime",
      commerceRealtime: "ws:/commerce-realtime",
      financialRealtime: "ws:/financial-realtime",
    };
  }

  /** Prometheus-style stub — expand with prom-client in services */
  @Get("metrics")
  metrics() {
    return "# venext metrics placeholder\n";
  }
}
