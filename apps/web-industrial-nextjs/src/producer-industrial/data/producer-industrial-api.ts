/**
 * Instruction 20.46 — client fetch gateway for producer industrial BFF.
 */

import type { ProducerIndustrialBffEndpoint } from "./producer-industrial-bff";
import { producerIndustrialBffUrl } from "./producer-industrial-bff";
import { logProducerDataDiagnostics } from "./producer-industrial-data-status";
import type { ProducerIndustrialEnvelope } from "./producer-industrial-data.types";

export type FetchProducerIndustrialResult<T> = {
  envelope: ProducerIndustrialEnvelope<T> | null;
  error: string | null;
  httpStatus: number | null;
  apiLatencyMs: number;
};

export async function fetchProducerIndustrialEndpoint<T>(
  endpoint: ProducerIndustrialBffEndpoint,
  options?: {
    organizationId?: string;
    signal?: AbortSignal;
  },
): Promise<FetchProducerIndustrialResult<T>> {
  const started = performance.now();
  const url = producerIndustrialBffUrl(endpoint, options?.organizationId);
  try {
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      signal: options?.signal,
    });
    const apiLatencyMs = Math.round(performance.now() - started);
    if (!res.ok) {
      return { envelope: null, error: `http_${res.status}`, httpStatus: res.status, apiLatencyMs };
    }
    const envelope = (await res.json()) as ProducerIndustrialEnvelope<T>;
    logProducerDataDiagnostics(endpoint, envelope);
    return {
      envelope: {
        ...envelope,
        diagnostics: { ...envelope.diagnostics, apiLatencyMs },
      },
      error: null,
      httpStatus: res.status,
      apiLatencyMs,
    };
  } catch (err) {
    const apiLatencyMs = Math.round(performance.now() - started);
    const message = err instanceof Error ? err.message : "network_error";
    return { envelope: null, error: message, httpStatus: null, apiLatencyMs };
  }
}
