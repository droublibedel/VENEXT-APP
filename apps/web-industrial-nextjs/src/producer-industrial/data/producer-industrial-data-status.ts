import type {
  ProducerDataSource,
  ProducerIndustrialDiagnostics,
  ProducerIndustrialEnvelope,
} from "./producer-industrial-data.types";

export function createProducerEnvelope<T>(args: {
  payload: T;
  organizationId: string;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
  fallbackReasons?: string[];
  diagnostics?: ProducerIndustrialDiagnostics;
}): ProducerIndustrialEnvelope<T> {
  return {
    dataSource: args.dataSource,
    generatedAt: new Date().toISOString(),
    organizationId: args.organizationId,
    fallbackUsed: args.fallbackUsed,
    fallbackReasons: args.fallbackReasons ?? [],
    diagnostics: args.diagnostics ?? {},
    payload: args.payload,
  };
}

export function mergeDataSource(a: ProducerDataSource, b: ProducerDataSource): ProducerDataSource {
  if (a === b) return a;
  return "mixed";
}

export function logProducerDataDiagnostics(
  endpoint: string,
  envelope: ProducerIndustrialEnvelope<unknown>,
): void {
  if (process.env.NODE_ENV !== "development") return;
  console.debug("[producer-industrial]", endpoint, {
    dataSource: envelope.dataSource,
    fallbackUsed: envelope.fallbackUsed,
    fallbackReasons: envelope.fallbackReasons,
    apiLatencyMs: envelope.diagnostics.apiLatencyMs,
    lastSuccessfulSyncAt: envelope.diagnostics.lastSuccessfulSyncAt,
  });
}
