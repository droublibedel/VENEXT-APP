import type {
  ExternalSignalFetchContext,
  ExternalSignalSnapshot,
} from "./external-signal.types";

/**
 * Provider abstraction — no hardcoded third-party SDKs (Instruction 5 §7).
 * Implementations may call HTTP, queues, or edge workers later.
 */
export interface ExternalSignalConnector {
  readonly id: string;
  readonly kind: ExternalSignalSnapshot["kind"];
  fetch(ctx: ExternalSignalFetchContext): Promise<ExternalSignalSnapshot[]>;
}
