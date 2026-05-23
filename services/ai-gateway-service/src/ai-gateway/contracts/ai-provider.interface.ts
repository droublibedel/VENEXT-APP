import type { EnrichedAiCompletionRequest } from "./ai-messages";

/**
 * Detachable provider surface — swap Mock → Qwen without changing controllers.
 */
export interface AiProvider {
  readonly id: "mock" | "qwen" | string;
  complete(
    request: EnrichedAiCompletionRequest,
  ): Promise<{ text: string; provider: string }>;
}
