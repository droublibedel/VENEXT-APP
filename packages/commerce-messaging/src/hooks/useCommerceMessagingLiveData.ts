import { useCallback, useEffect, useRef, useState } from "react";

import {
  COMMERCE_MESSAGING_ORG_ID,
  mockCommerceConversations,
  mockCommerceMessages,
  mockOrderContext,
  mockProductContext,
} from "../mocks/commerce-messaging-mock-data";
import type {
  CommerceConversation,
  CommerceDataSource,
  CommerceEnvelope,
  CommerceLiveState,
  CommerceMessage,
  CommerceMessagingBffEndpoint,
  CommerceOrderContext,
  CommerceProductContext,
} from "./commerce-messaging.types";

const cache = new Map<string, CommerceEnvelope<unknown>>();

export function clearCommerceMessagingCache() {
  cache.clear();
}

function envelope<T>(payload: T): CommerceEnvelope<T> {
  return {
    dataSource: "fallback",
    fallbackUsed: true,
    organizationId: COMMERCE_MESSAGING_ORG_ID,
    payload,
  };
}

async function fetchEndpoint<T>(
  endpoint: CommerceMessagingBffEndpoint,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<{ envelope: CommerceEnvelope<T> | null; error: string | null }> {
  const qs = new URLSearchParams({
    organizationId: COMMERCE_MESSAGING_ORG_ID,
    ...params,
  });
  const url = `/api/commerce-messaging/${endpoint}?${qs}`;
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store", signal });
    if (!res.ok) return { envelope: null, error: `http_${res.status}` };
    return { envelope: (await res.json()) as CommerceEnvelope<T>, error: null };
  } catch {
    return { envelope: null, error: "network" };
  }
}

export type CommerceMessagingDataOptions = {
  enabled?: boolean;
  liveEnabled?: boolean;
};

function useCommerceEndpoint<T>(
  endpoint: CommerceMessagingBffEndpoint,
  fallback: () => CommerceEnvelope<T>,
  params: Record<string, string>,
  enabled = true,
  liveEnabled = true,
): CommerceLiveState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<CommerceDataSource>("fallback");
  const [fallbackUsed, setFallbackUsed] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const tickRef = useRef(0);
  const fbRef = useRef(fallback);
  fbRef.current = fallback;
  const paramsKey = JSON.stringify(params);

  const load = useCallback(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    tickRef.current += 1;
    const tick = tickRef.current;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    if (!liveEnabled) {
      const fb = fbRef.current();
      cache.set(`${endpoint}:${paramsKey}`, fb as CommerceEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(null);
      setLoading(false);
      return;
    }

    const key = `${endpoint}:${paramsKey}`;
    const cached = cache.get(key) as CommerceEnvelope<T> | undefined;
    if (cached) {
      setData(cached.payload);
      setDataSource(cached.dataSource);
      setFallbackUsed(cached.fallbackUsed);
    }
    setLoading(true);
    setError(null);

    void fetchEndpoint<T>(endpoint, params, ac.signal).then((result) => {
      if (tick !== tickRef.current) return;
      if (result.envelope) {
        cache.set(key, result.envelope as CommerceEnvelope<unknown>);
        setData(result.envelope.payload);
        setDataSource(result.envelope.dataSource);
        setFallbackUsed(result.envelope.fallbackUsed);
        setError(null);
        setLoading(false);
        return;
      }
      const fb = fbRef.current();
      cache.set(key, fb as CommerceEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(result.error);
      setLoading(false);
    });
  }, [enabled, endpoint, liveEnabled, paramsKey]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { data, loading, error, dataSource, fallbackUsed, refresh: load };
}

export function useCommerceConversations(options: CommerceMessagingDataOptions = {}) {
  const { enabled = true, liveEnabled = true } = options;
  return useCommerceEndpoint<CommerceConversation[]>(
    "conversations",
    () => envelope(mockCommerceConversations()),
    {},
    enabled,
    liveEnabled,
  );
}

export function useCommerceMessages(
  conversationId: string | null,
  options: CommerceMessagingDataOptions = {},
) {
  const { enabled = true, liveEnabled = true } = options;
  const id = conversationId ?? "";
  return useCommerceEndpoint<CommerceMessage[]>(
    "messages",
    () => envelope(mockCommerceMessages(id || "c1")),
    { conversationId: id },
    enabled && Boolean(conversationId),
    liveEnabled,
  );
}

export function useCommerceProductContext(
  productId: string | null,
  options: CommerceMessagingDataOptions = {},
) {
  const { enabled = true, liveEnabled = true } = options;
  const id = productId ?? "pr1";
  return useCommerceEndpoint<CommerceProductContext>(
    "product-context",
    () => envelope(mockProductContext(id)),
    { productId: id },
    enabled && Boolean(productId),
    liveEnabled,
  );
}

export function useCommerceOrderContext(
  orderId: string | null,
  options: CommerceMessagingDataOptions = {},
) {
  const { enabled = true, liveEnabled = true } = options;
  const id = orderId ?? "o1";
  return useCommerceEndpoint<CommerceOrderContext>(
    "order-context",
    () => envelope(mockOrderContext(id)),
    { orderId: id },
    enabled && Boolean(orderId),
    liveEnabled,
  );
}
