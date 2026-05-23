import { useCallback, useEffect, useRef, useState } from "react";

import {
  COMMERCE_WALLET_ORG_ID,
  mockCommercePartnerPayments,
  mockCommercePaymentActivity,
  mockCommerceTransactions,
  mockCommerceWalletBalance,
} from "../mocks/commerce-wallet-mock-data";
import type {
  CommercePartnerPayment,
  CommercePaymentActivity,
  CommerceTransaction,
  CommerceWalletBalance,
  CommerceWalletBffEndpoint,
  CommerceWalletDataSource,
  CommerceWalletEnvelope,
  CommerceWalletLiveState,
} from "./commerce-wallet.types";

const cache = new Map<string, CommerceWalletEnvelope<unknown>>();

export function clearCommerceWalletCache() {
  cache.clear();
}

async function fetchEndpoint<T>(
  endpoint: CommerceWalletBffEndpoint,
  signal?: AbortSignal,
): Promise<{ envelope: CommerceWalletEnvelope<T> | null; error: string | null }> {
  const qs = new URLSearchParams({ organizationId: COMMERCE_WALLET_ORG_ID });
  const url = `/api/commerce-wallet/${endpoint}?${qs}`;
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store", signal });
    if (!res.ok) return { envelope: null, error: `http_${res.status}` };
    return { envelope: (await res.json()) as CommerceWalletEnvelope<T>, error: null };
  } catch {
    return { envelope: null, error: "network" };
  }
}

export type CommerceWalletDataOptions = {
  enabled?: boolean;
  liveEnabled?: boolean;
};

function useCommerceWalletEndpoint<T>(
  endpoint: CommerceWalletBffEndpoint,
  fallback: () => CommerceWalletEnvelope<T>,
  enabled = true,
  liveEnabled = true,
): CommerceWalletLiveState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<CommerceWalletDataSource>("fallback");
  const [fallbackUsed, setFallbackUsed] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const tickRef = useRef(0);
  const fbRef = useRef(fallback);
  fbRef.current = fallback;

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
      cache.set(endpoint, fb as CommerceWalletEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(null);
      setLoading(false);
      return;
    }

    const cached = cache.get(endpoint) as CommerceWalletEnvelope<T> | undefined;
    if (cached) {
      setData(cached.payload);
      setDataSource(cached.dataSource);
      setFallbackUsed(cached.fallbackUsed);
    }

    setLoading(true);
    void fetchEndpoint<T>(endpoint, ac.signal).then(({ envelope, error: err }) => {
      if (tick !== tickRef.current) return;
      if (envelope && !envelope.fallbackUsed) {
        cache.set(endpoint, envelope as CommerceWalletEnvelope<unknown>);
        setData(envelope.payload);
        setDataSource(envelope.dataSource);
        setFallbackUsed(false);
        setError(null);
      } else {
        const fb = fbRef.current();
        cache.set(endpoint, fb as CommerceWalletEnvelope<unknown>);
        setData(fb.payload);
        setDataSource("fallback");
        setFallbackUsed(true);
        setError(err);
      }
      setLoading(false);
    });
  }, [enabled, liveEnabled, endpoint]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { data, loading, error, dataSource, fallbackUsed, refresh: load };
}

export function useCommerceWalletBalance(opts: CommerceWalletDataOptions = {}) {
  return useCommerceWalletEndpoint(
    "balance",
    mockCommerceWalletBalance,
    opts.enabled ?? true,
    opts.liveEnabled ?? false,
  );
}

export function useCommerceTransactions(opts: CommerceWalletDataOptions = {}) {
  return useCommerceWalletEndpoint(
    "transactions",
    mockCommerceTransactions,
    opts.enabled ?? true,
    opts.liveEnabled ?? false,
  );
}

export function useCommercePartnerPayments(opts: CommerceWalletDataOptions = {}) {
  return useCommerceWalletEndpoint(
    "payments",
    mockCommercePartnerPayments,
    opts.enabled ?? true,
    opts.liveEnabled ?? false,
  );
}

export function useCommercePaymentActivity(opts: CommerceWalletDataOptions = {}) {
  return useCommerceWalletEndpoint(
    "activity",
    mockCommercePaymentActivity,
    opts.enabled ?? true,
    opts.liveEnabled ?? false,
  );
}

export {
  useCommerceWalletBalance as useCommerceWalletLiveData,
};
