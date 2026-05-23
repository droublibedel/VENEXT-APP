import { useCallback, useEffect, useRef, useState } from "react";

import type { CommerceMessage } from "./commerce-messaging.types.js";
import {
  appendThreadMessage,
  deleteMessageGlobally,
  getThreadMessages,
  seedThreadMessages,
  subscribeCommerceMessagingThreadStore,
} from "../realtime/commerce-messaging-thread-store.js";
import {
  generateVoiceWaveformPeaks,
  startCommerceMessagingRealtime,
} from "../realtime/commerce-messaging-realtime.js";

export function useCommerceMessagingThread(
  conversationId: string | null,
  options?: {
    liveEnabled?: boolean;
    seed?: CommerceMessage[];
    fetchDelta?: (sinceSequence: number) => Promise<CommerceMessage[]>;
  },
) {
  const [messages, setMessages] = useState<CommerceMessage[]>([]);
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    if (options?.seed?.length && seededFor.current !== conversationId) {
      seedThreadMessages(conversationId, options.seed);
      seededFor.current = conversationId;
    }
    const sync = () => setMessages(getThreadMessages(conversationId));
    sync();
    const unsubStore = subscribeCommerceMessagingThreadStore(sync);
    const stopRt = startCommerceMessagingRealtime({
      conversationId,
      enabled: options?.liveEnabled !== false,
      fetchDelta: options?.fetchDelta,
      onMessages: setMessages,
    });
    return () => {
      unsubStore();
      stopRt();
    };
  }, [conversationId, options?.liveEnabled, options?.fetchDelta]);

  const sendText = useCallback(
    (text: string) => {
      if (!conversationId || !text.trim()) return null;
      return appendThreadMessage({
        id: "",
        conversationId,
        kind: "text",
        author: "self",
        text: text.trim(),
        at: new Date().toISOString(),
        status: "sending",
      });
    },
    [conversationId],
  );

  const sendVoice = useCallback(
    (durationSec: number, waveform?: number[]) => {
      if (!conversationId) return null;
      const peaks = waveform ?? generateVoiceWaveformPeaks(durationSec);
      return appendThreadMessage({
        id: "",
        conversationId,
        kind: "voice",
        author: "self",
        text: "",
        at: new Date().toISOString(),
        voiceDurationSec: durationSec,
        voiceWaveform: peaks,
        voicePlaybackUrl: "blob:venext-voice",
        status: "sending",
      });
    },
    [conversationId],
  );

  const removeMessage = useCallback(
    (messageId: string) => {
      if (!conversationId) return false;
      return deleteMessageGlobally(conversationId, messageId);
    },
    [conversationId],
  );

  return { messages, sendText, sendVoice, removeMessage };
}
