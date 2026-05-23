import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import type { Server, WebSocket } from "ws";

import { CommerceRealtimeAuthorizationService } from "./commerce-realtime-authorization.service";

type ClientState = {
  threadId?: string;
  lastTypingAt: number;
  userId?: string;
  organizationId?: string;
  realtimeAuthorizationValidated?: boolean;
  wsThreadScopeValidated?: boolean;
  threadRealtimeAuthMode?: string;
};

/**
 * Commerce thread fan-out — negotiation + typing + delivery hints (Instruction 7 §9).
 * Instruction 20.1B — subscribe must not be threadId-only outside explicit insecure OPEN dev mode;
 * production defaults to core-domain membership validation (userId + organizationId on subscribe payload).
 */
@WebSocketGateway({ path: "/commerce-realtime" })
export class CommerceRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly clients = new Map<WebSocket, ClientState>();
  private tick?: ReturnType<typeof setInterval>;

  constructor(private readonly commerceRtAuth: CommerceRealtimeAuthorizationService) {}

  onModuleInit() {
    this.tick = setInterval(() => this.broadcastHeartbeat(), 5000);
  }

  onModuleDestroy() {
    if (this.tick) clearInterval(this.tick);
  }

  handleConnection(client: WebSocket) {
    const isProd = process.env.NODE_ENV === "production";
    const openInsecure = Boolean(process.env.VENEXT_COMMERCE_WS_OPEN_INSECURE?.trim());
    const openAllowed = !isProd || openInsecure;
    const mode = process.env.VENEXT_COMMERCE_WS_THREAD_AUTH_MODE?.trim() || "OPEN";

    this.clients.set(client, { lastTypingAt: 0 });
    client.send(
      JSON.stringify({
        type: "session.open",
        channel: "commerce.messaging",
        hint:
          "subscribe: { type, threadId, userId?, organizationId?, authToken? } — production requires actor + core validation unless VENEXT_COMMERCE_WS_OPEN_INSECURE=1",
        threadRealtimeAuthMode: openAllowed && mode === "OPEN" ? "OPEN_DEV" : mode,
        commerceWsSubscribeSecretConfigured: Boolean(process.env.VENEXT_COMMERCE_WS_SUBSCRIBE_SECRET?.trim()),
        venextCommerceWsOpenInsecure: openInsecure,
        productionLike: isProd,
      }),
    );

    client.on("message", (raw) => {
      void (async () => {
        try {
          const msg = JSON.parse(String(raw)) as {
            type?: string;
            threadId?: string;
            typing?: boolean;
            authToken?: string;
            userId?: string;
            organizationId?: string;
          };
          if (msg.type === "subscribe" && msg.threadId) {
            const secret = process.env.VENEXT_COMMERCE_WS_SUBSCRIBE_SECRET?.trim();
            let allowed = false;
            let realtimeAuthorizationValidated = false;
            let wsThreadScopeValidated = false;
            let authModeLabel = mode;

            if (mode === "TOKEN" && secret) {
              if (msg.authToken?.trim() !== secret) {
                client.send(
                  JSON.stringify({
                    type: "subscribe.denied",
                    threadId: msg.threadId,
                    reason: "commerce_ws_thread_token_required",
                  }),
                );
                return;
              }
              allowed = true;
              realtimeAuthorizationValidated = true;
              wsThreadScopeValidated = false;
              authModeLabel = "TOKEN_LEGACY";
            } else if (openAllowed && mode === "OPEN") {
              allowed = true;
              realtimeAuthorizationValidated = false;
              wsThreadScopeValidated = false;
              authModeLabel = "OPEN_DEV";
            } else {
              const uid = msg.userId?.trim();
              const oid = msg.organizationId?.trim();
              if (!uid || !oid) {
                client.send(
                  JSON.stringify({
                    type: "subscribe.denied",
                    threadId: msg.threadId,
                    reason: "commerce_ws_subscribe_actor_required",
                    hint: "Send userId and organizationId for core thread validation",
                  }),
                );
                return;
              }
              const core = await this.commerceRtAuth.validateCommerceThreadSubscribe({
                threadId: msg.threadId.trim(),
                userId: uid,
                organizationId: oid,
              });
              realtimeAuthorizationValidated = core.realtimeAuthorizationValidated;
              wsThreadScopeValidated = Boolean(core.wsThreadScopeValidated);
              allowed = Boolean(core.authorized);
              authModeLabel = "CORE";
              if (!allowed) {
                client.send(
                  JSON.stringify({
                    type: "subscribe.denied",
                    threadId: msg.threadId,
                    reason: "commerce_ws_thread_policy_denied",
                    realtimeAuthorizationValidated,
                    wsThreadScopeValidated,
                  }),
                );
                return;
              }
            }

            if (!allowed) {
              client.send(
                JSON.stringify({
                  type: "subscribe.denied",
                  threadId: msg.threadId,
                  reason: "commerce_ws_subscribe_not_allowed",
                }),
              );
              return;
            }

            const st = this.clients.get(client);
            if (st) {
              st.threadId = msg.threadId;
              st.userId = msg.userId?.trim();
              st.organizationId = msg.organizationId?.trim();
              st.realtimeAuthorizationValidated = realtimeAuthorizationValidated;
              st.wsThreadScopeValidated = wsThreadScopeValidated;
              st.threadRealtimeAuthMode = authModeLabel;
            }
            client.send(
              JSON.stringify({
                type: "subscribe.ack",
                threadId: msg.threadId,
                realtimeAuthorizationValidated,
                wsThreadScopeValidated,
                threadRealtimeAuthMode: authModeLabel,
              }),
            );
          }
          if (msg.type === "typing" && msg.threadId) {
            const st = this.clients.get(client);
            if (st) st.lastTypingAt = Date.now();
            this.fanout(msg.threadId, {
              type: "typing.indicator",
              threadId: msg.threadId,
              active: Boolean(msg.typing),
            });
          }
        } catch {
          /* ignore */
        }
      })();
    });
  }

  handleDisconnect(client: WebSocket) {
    this.clients.delete(client);
  }

  private fanout(threadId: string, payload: object) {
    const body = JSON.stringify(payload);
    for (const [ws, st] of this.clients) {
      if (st.threadId === threadId) {
        try {
          ws.send(body);
        } catch {
          this.clients.delete(ws);
        }
      }
    }
  }

  /** Instruction 20.1 — domain HTTP fan-in (core-domain → gateway → subscribed commerce WS clients). */
  publishNegotiationDraftSignal(threadId: string, eventType: string, body: Record<string, unknown>): void {
    this.fanout(threadId, { type: eventType, threadId, ...body });
  }

  /** Instruction 20.2 — sponsored discovery / handshake (same commerce WS transport). */
  publishSponsoredDiscoverySignal(threadId: string, eventType: string, body: Record<string, unknown>): void {
    this.fanout(threadId, {
      type: eventType,
      threadId,
      sponsoredScopeValidated: true,
      temporaryCommercialHandshake: true,
      relationshipStillRequired: true,
      ...body,
    });
  }

  private broadcastHeartbeat() {
    for (const [ws, st] of this.clients) {
      if (!st.threadId) continue;
      try {
        ws.send(
          JSON.stringify({
            type: "negotiation.sync.tick",
            threadId: st.threadId,
            deliveryStateHint: "SENT",
            ts: new Date().toISOString(),
            realtimeAuthorizationValidated: st.realtimeAuthorizationValidated ?? false,
            wsThreadScopeValidated: st.wsThreadScopeValidated ?? false,
            threadRealtimeAuthMode: st.threadRealtimeAuthMode,
          }),
        );
      } catch {
        this.clients.delete(ws);
      }
    }
  }
}
