"use client";

import { useEffect, useRef, useState } from "react";

import { commerceWsUrl } from "../constants";

export type CommerceWsEvent =
  | {
      type: "session.open";
      channel?: string;
      hint?: string;
      threadRealtimeAuthMode?: string;
      commerceWsSubscribeSecretConfigured?: boolean;
      venextCommerceWsOpenInsecure?: boolean;
      productionLike?: boolean;
    }
  | {
      type: "subscribe.ack";
      threadId: string;
      realtimeAuthorizationValidated?: boolean;
      wsThreadScopeValidated?: boolean;
      threadRealtimeAuthMode?: string;
    }
  | { type: "subscribe.denied"; threadId?: string; reason?: string; hint?: string }
  | { type: "typing.indicator"; threadId: string; active: boolean }
  | {
      type: "negotiation.sync.tick";
      threadId: string;
      deliveryStateHint?: string;
      ts?: string;
      realtimeAuthorizationValidated?: boolean;
      wsThreadScopeValidated?: boolean;
      threadRealtimeAuthMode?: string;
    }
  | { type: "negotiation.updated"; threadId: string; negotiationState?: string; ts?: string }
  | { type: "negotiation.accepted"; threadId: string; ts?: string }
  | { type: "negotiation.rejected"; threadId: string; ts?: string }
  | { type: "draft.updated"; threadId: string; draft?: unknown; ts?: string }
  | { type: "draft.ready"; threadId: string; draft?: unknown; ts?: string }
  | { type: "draft.human_confirmed"; threadId: string; metadataOnly?: boolean; ts?: string }
  | { type: "reservation.created"; threadId: string; reservationIntentId?: string; ts?: string }
  | { type: "reservation.expired"; threadId: string; reservationIntentId?: string; ts?: string };

export function useCommerceRealtime(
  threadId: string | null,
  opts?: { typing?: boolean; actor?: { userId: string; organizationId: string } },
) {
  const [events, setEvents] = useState<CommerceWsEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [threadRealtimeAuthMode, setThreadRealtimeAuthMode] = useState<string | null>(null);
  const [wsThreadScopeValidated, setWsThreadScopeValidated] = useState<boolean | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!threadId) return;
    const url = commerceWsUrl();
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return;
    }
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      const payload: Record<string, unknown> = { type: "subscribe", threadId };
      const a = opts?.actor;
      if (a?.userId && a.organizationId) {
        payload.userId = a.userId;
        payload.organizationId = a.organizationId;
      }
      ws.send(JSON.stringify(payload));
    };
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.data)) as CommerceWsEvent;
        if (parsed.type === "session.open") {
          setThreadRealtimeAuthMode(parsed.threadRealtimeAuthMode ?? "OPEN");
        }
        if (parsed.type === "subscribe.ack") {
          setWsThreadScopeValidated(parsed.wsThreadScopeValidated ?? null);
        }
        setEvents((prev) => [...prev.slice(-24), parsed]);
      } catch {
        /* ignore */
      }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
    // Actor is addressed by stable id fields; including `opts` would reconnect on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- opts.actor object identity is not stable across renders
  }, [threadId, opts?.actor?.userId, opts?.actor?.organizationId]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "typing", threadId, typing: Boolean(opts?.typing) }));
  }, [threadId, opts?.typing]);

  const lastTypingRemote = [...events].reverse().find((e) => e.type === "typing.indicator");

  return { connected, events, lastTypingRemote, threadRealtimeAuthMode, wsThreadScopeValidated };
}
