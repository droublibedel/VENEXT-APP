# WebSocket / realtime strategy

- **Gateway**: `services/api-gateway` hosts `RealtimeGateway` on path `/realtime` using `@nestjs/platform-ws` + `ws`.
- **Observability**: `CorrelationInterceptor` stamps `x-correlation-id` for tracing across fan-out calls.
- **Health**: `GET /health` advertises websocket path; `GET /metrics` reserved for Prometheus wiring.
- **Nginx**: `infrastructure/nginx/gateway.conf` upgrades `/realtime` connections and forwards `x-network-quality` when clients supply it.

# API gateway strategy

- **Edge termination**: Nginx handles TLS (prod), body size limits, websocket upgrades.
- **Routing**: gateway remains thin; versioned routes (`/v1/...`) live on domain microservices today, with optional future BFF aggregation inside gateway modules.
- **Resilience**: correlation IDs + server timing headers provide immediate performance telemetry while centralized logging agents ship stdout JSON.
