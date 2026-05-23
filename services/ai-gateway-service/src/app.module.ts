import { Module } from "@nestjs/common";
import { AiGatewayModule } from "./ai-gateway/ai-gateway.module";
import { PolesAiModule } from "./modules/poles/poles-ai.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [AiGatewayModule, PolesAiModule],
  controllers: [HealthController],
})
export class AppModule {}
