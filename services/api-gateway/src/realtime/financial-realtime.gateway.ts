import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import type { Server, WebSocket } from "ws";

type ClientState = {
  organizationId?: string;
  lastSentAt: number;
};

/**
 * Financial event fan-out (Instruction 8 §14) — thin transport; ledger remains on core-domain.
 */
@WebSocketGateway({ path: "/financial-realtime" })
export class FinancialRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly clients = new Map<WebSocket, ClientState>();
  private tick?: ReturnType<typeof setInterval>;

  onModuleInit() {
    this.tick = setInterval(() => this.pulse(), 7000);
  }

  onModuleDestroy() {
    if (this.tick) clearInterval(this.tick);
  }

  handleConnection(client: WebSocket) {
    this.clients.set(client, { lastSentAt: 0 });
    client.send(
      JSON.stringify({
        type: "session.open",
        channel: "financial.runtime",
        events: [
          "payment_received",
          "payment_failed",
          "wallet_updated",
          "qr_scanned",
          "transfer_received",
          "transaction_confirmed",
        ],
      }),
    );

    client.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as { type?: string; organizationId?: string };
        if (msg.type === "subscribe" && msg.organizationId) {
          const st = this.clients.get(client);
          if (st) st.organizationId = msg.organizationId;
          client.send(JSON.stringify({ type: "subscribe.ack", organizationId: msg.organizationId }));
        }
      } catch {
        /* ignore */
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    this.clients.delete(client);
  }

  private pulse() {
    const now = Date.now();
    for (const [ws, st] of this.clients) {
      if (!st.organizationId) continue;
      if (now - st.lastSentAt < 4000) continue;
      try {
        ws.send(
          JSON.stringify({
            type: "wallet_updated",
            organizationId: st.organizationId,
            balanceHint: "unchanged",
            ts: new Date().toISOString(),
            networkQualityHint: "adaptive",
          }),
        );
        st.lastSentAt = now;
      } catch {
        this.clients.delete(ws);
      }
    }
  }
}
