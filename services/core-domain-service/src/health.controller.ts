import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return { service: "core-domain-service", prisma: true };
  }
}
