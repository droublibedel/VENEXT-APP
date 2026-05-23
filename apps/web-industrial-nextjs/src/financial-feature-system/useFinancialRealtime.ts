"use client";

import { useEffect, useRef, useState } from "react";

import { financialWsUrl } from "./constants";

export function useFinancialRealtime(organizationId: string | null) {
  const [connected, setConnected] = useState(false);
  const [last, setLast] = useState<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let ws: WebSocket;
    try {
      ws = new WebSocket(financialWsUrl());
    } catch {
      return;
    }
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "subscribe", organizationId }));
    };
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        setLast(JSON.parse(String(ev.data)));
      } catch {
        /* ignore */
      }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [organizationId]);

  return { connected, lastEvent: last };
}
