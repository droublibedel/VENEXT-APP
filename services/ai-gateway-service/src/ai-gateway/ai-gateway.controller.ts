import { Body, Controller, Post } from "@nestjs/common";
import { AiGatewayService } from "./ai-gateway.service";
import type { AiCompletionRequest } from "./contracts/ai-messages";

@Controller("v1/ai")
export class AiGatewayController {
  constructor(private readonly ai: AiGatewayService) {}

  @Post("complete")
  complete(@Body() body: AiCompletionRequest) {
    return this.ai.complete(body);
  }
}
