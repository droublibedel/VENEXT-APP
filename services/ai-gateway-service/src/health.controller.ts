import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return { service: "ai-gateway-service", mode: "simulation" };
  }
}
