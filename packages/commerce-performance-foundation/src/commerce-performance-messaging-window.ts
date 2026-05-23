import { PERF_MAX_VISIBLE_MESSAGES } from "./commerce-performance-limits";

export type VisibleMessageWindow<T> = {
  visible: T[];
  total: number;
  startIndex: number;
  endIndex: number;
  hasOlder: boolean;
  olderOffset: number;
};

/** Fenêtre conversation — max 40 messages rendus (Instruction 20.85-A). */
export function sliceVisibleConversationWindow<T>(
  messages: readonly T[],
  maxVisible = PERF_MAX_VISIBLE_MESSAGES,
  olderOffset = 0,
): T[] {
  if (messages.length <= maxVisible) return [...messages];
  const safeOlder = Math.max(0, Math.min(olderOffset, Math.max(0, messages.length - maxVisible)));
  const end = messages.length - safeOlder;
  const start = Math.max(0, end - maxVisible);
  return messages.slice(start, end);
}

export function buildVisibleMessageWindow<T>(
  messages: readonly T[],
  options: { maxVisible?: number; olderOffset?: number } = {},
): VisibleMessageWindow<T> {
  const maxVisible = options.maxVisible ?? PERF_MAX_VISIBLE_MESSAGES;
  const olderOffset = Math.max(0, options.olderOffset ?? 0);
  const total = messages.length;
  const safeOlder = Math.min(olderOffset, Math.max(0, total - maxVisible));
  const endIndex = total - safeOlder;
  const startIndex = Math.max(0, endIndex - maxVisible);
  const visible = messages.slice(startIndex, endIndex);
  return {
    visible,
    total,
    startIndex,
    endIndex,
    hasOlder: startIndex > 0,
    olderOffset: safeOlder,
  };
}

/** Lazy append — révèle un lot d'historique plus ancien. */
export function nextOlderMessageOffset(currentOlderOffset: number, batchSize = 20): number {
  return currentOlderOffset + Math.max(1, batchSize);
}
