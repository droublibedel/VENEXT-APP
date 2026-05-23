# AI gateway (simulation mode)

Structure under `services/ai-gateway-service/src/ai-gateway/`:

- `contracts/ai-provider.interface.ts` — detachable provider surface (`mock` \| future `qwen`).
- `contracts/ai-messages.ts` — role-specialized personas + optional geo hints.
- `providers/mock-provider/mock-ai.provider.ts` — deterministic echo for integration tests.
- `context-engine/context-engine.ts` — hashes facet/geo/persona into `contextDigest` for future RAG + audit trails.

Controllers expose `POST /v1/ai/complete` which always routes through `AiGatewayService` so swapping providers never changes public contracts.
