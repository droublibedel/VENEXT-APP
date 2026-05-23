import { Module } from "@nestjs/common";
import { AiGatewayService } from "./ai-gateway.service";
import { AiGatewayController } from "./ai-gateway.controller";
import { MockAiProvider } from "./providers/mock-provider/mock-ai.provider";
import { ContextEngine } from "./context-engine/context-engine";

@Module({
  controllers: [AiGatewayController],
  providers: [
    AiGatewayService,
    ContextEngine,
    MockAiProvider,
    { provide: "AI_PROVIDER", useExisting: MockAiProvider },
  ],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
