import { Controller, Get } from "@nestjs/common";

@Controller("v1/supply")
export class SupplyStreamsController {
  @Get("streams")
  streams() {
    return { kafkaTopics: ["supply.signal.v1"], elasticsearch: "ready-layer" };
  }
}
