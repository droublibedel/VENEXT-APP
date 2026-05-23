"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { DEMO_ACTOR, venextActorHeaders } from "./constants";

/** Mirrors core-domain `MockConversationInsightService` payload. */
export type MockInsightPayload = {
  provider: "mock-conversation-insight";
  summary: string[];
  risks: string[];
  suggestions: string[];
};

const Ctx = createContext<{
  insight: MockInsightPayload | null;
  loading: boolean;
  refresh: (threadId: string) => Promise<void>;
} | null>(null);

export function MockConversationInsightProvider({ children }: { children: ReactNode }) {
  const [insight, setInsight] = useState<MockInsightPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (threadId: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/core/v1/commerce-messaging/threads/${threadId}/insights/mock`, {
        method: "POST",
        headers: venextActorHeaders(DEMO_ACTOR),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = (await r.json()) as MockInsightPayload;
      setInsight(j);
    } catch {
      setInsight(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({ insight, loading, refresh }), [insight, loading, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMockConversationInsight() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMockConversationInsight requires provider");
  return v;
}
