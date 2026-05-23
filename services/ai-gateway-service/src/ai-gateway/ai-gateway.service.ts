import { Inject, Injectable } from "@nestjs/common";
import type { AiProvider } from "./contracts/ai-provider.interface";
import type { AiCompletionRequest } from "./contracts/ai-messages";
import { ContextEngine } from "./context-engine/context-engine";

@Injectable()
export class AiGatewayService {
  constructor(
    @Inject("AI_PROVIDER") private readonly provider: AiProvider,
    private readonly context: ContextEngine,
  ) {}

  async complete(req: AiCompletionRequest) {
    const enriched = this.context.attach(req);
    return this.provider.complete(enriched);
  }
}
