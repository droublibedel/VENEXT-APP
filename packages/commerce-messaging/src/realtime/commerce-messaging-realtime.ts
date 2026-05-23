import {
  ackThreadDelivery,
  appendThreadMessage,
  getThreadMessages,
  getThreadSequence,
  subscribeCommerceMessagingThreadStore,
} from "./commerce-messaging-thread-store.js";
import type { CommerceMessage } from "../hooks/commerce-messaging.types.js";

export type CommerceRealtimeOptions = {
  conversationId: string;
  pollIntervalMs?: number;
  enabled?: boolean;
  onMessages?: (messages: CommerceMessage[]) => void;
  fetchDelta?: (sinceSequence: number) => Promise<CommerceMessage[]>;
};

const activePolls = new Map<string, ReturnType<typeof setInterval>>();

/** Sync légère — polling espacé + ack, pas de WebSocket lourd. */
export function startCommerceMessagingRealtime(opts: CommerceRealtimeOptions): () => void {
  const {
    conversationId,
    pollIntervalMs = 2200,
    enabled = true,
    onMessages,
    fetchDelta,
  } = opts;

  if (!enabled) return () => undefined;

  const push = () => onMessages?.(getThreadMessages(conversationId));
  const unsub = subscribeCommerceMessagingThreadStore(push);
  push();

  const tick = async () => {
    ackThreadDelivery(conversationId);
    if (fetchDelta) {
      try {
        const delta = await fetchDelta(getThreadSequence(conversationId));
        for (const m of delta) {
          if (!getThreadMessages(conversationId).some((x) => x.id === m.id)) {
            appendThreadMessage({ ...m, conversationId });
          }
        }
      } catch {
        /* retry silencieux */
      }
    }
    push();
  };

  const id = setInterval(() => void tick(), pollIntervalMs);
  activePolls.set(conversationId, id);
  void tick();

  return () => {
    clearInterval(id);
    activePolls.delete(conversationId);
    unsub();
  };
}

export function stopAllCommerceMessagingRealtime(): void {
  for (const id of activePolls.values()) clearInterval(id);
  activePolls.clear();
}

export function generateVoiceWaveformPeaks(durationSec: number, seed = 0): number[] {
  const count = Math.min(48, Math.max(12, Math.round(durationSec * 8)));
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    const w = Math.sin((i + seed) * 0.7) * 0.35 + Math.sin((i + seed) * 2.1) * 0.2;
    peaks.push(Math.max(0.12, Math.min(1, 0.45 + w)));
  }
  return peaks;
}
