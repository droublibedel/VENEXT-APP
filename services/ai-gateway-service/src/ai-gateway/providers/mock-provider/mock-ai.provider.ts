import { Injectable } from "@nestjs/common";
import type { AiProvider } from "../../contracts/ai-provider.interface";
import type { EnrichedAiCompletionRequest } from "../../contracts/ai-messages";

@Injectable()
export class MockAiProvider implements AiProvider {
  readonly id = "mock" as const;

  async complete(request: EnrichedAiCompletionRequest) {
    return {
      provider: this.id,
      text: `[MOCK:${request.persona}] ${request.prompt.slice(0, 120)}… | ctx=${request.contextDigest}`,
    };
  }
}
