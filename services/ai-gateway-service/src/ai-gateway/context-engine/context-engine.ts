import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import type {
  AiCompletionRequest,
  EnrichedAiCompletionRequest,
} from "../contracts/ai-messages";

@Injectable()
export class ContextEngine {
  attach(req: AiCompletionRequest): EnrichedAiCompletionRequest {
    const digest = createHash("sha256")
      .update(
        JSON.stringify({
          facets: req.facets,
          geo: req.geo,
          persona: req.persona,
          proactive: req.proactive ?? false,
        }),
      )
      .digest("hex")
      .slice(0, 16);
    return { ...req, contextDigest: digest };
  }
}
