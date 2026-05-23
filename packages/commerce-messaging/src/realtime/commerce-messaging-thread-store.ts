import type { CommerceMessage } from "../hooks/commerce-messaging.types.js";

export type ThreadStoreListener = () => void;

type ConversationBucket = {
  messages: CommerceMessage[];
  sequence: number;
  lastAckAt: string | null;
};

const buckets = new Map<string, ConversationBucket>();
const listeners = new Set<ThreadStoreListener>();

function bucket(conversationId: string): ConversationBucket {
  let b = buckets.get(conversationId);
  if (!b) {
    b = { messages: [], sequence: 0, lastAckAt: null };
    buckets.set(conversationId, b);
  }
  return b;
}

function notify(): void {
  for (const fn of listeners) fn();
}

export function subscribeCommerceMessagingThreadStore(fn: ThreadStoreListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getThreadMessages(conversationId: string): CommerceMessage[] {
  return bucket(conversationId).messages.filter((m) => !m.deletedGlobally);
}

export function seedThreadMessages(conversationId: string, messages: CommerceMessage[]): void {
  const b = bucket(conversationId);
  b.messages = messages.map((m) => ({ ...m, conversationId }));
  b.sequence = messages.length;
  notify();
}

export function appendThreadMessage(message: CommerceMessage): CommerceMessage {
  const b = bucket(message.conversationId);
  const row: CommerceMessage = {
    ...message,
    id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: message.status ?? "sent",
  };
  b.messages.push(row);
  b.sequence += 1;
  notify();
  return row;
}

/** Suppression VENEXT globale — disparaît expéditeur ET destinataire. */
export function deleteMessageGlobally(conversationId: string, messageId: string): boolean {
  const b = bucket(conversationId);
  const idx = b.messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return false;
  b.messages[idx] = {
    ...b.messages[idx]!,
    deletedGlobally: true,
    text: "",
    voicePlaybackUrl: undefined,
    imageUrl: undefined,
  };
  b.sequence += 1;
  notify();
  return true;
}

export function updateMessageStatus(
  conversationId: string,
  messageId: string,
  status: CommerceMessage["status"],
): void {
  const b = bucket(conversationId);
  const row = b.messages.find((m) => m.id === messageId);
  if (!row) return;
  row.status = status;
  notify();
}

export function ackThreadDelivery(conversationId: string): void {
  const b = bucket(conversationId);
  b.lastAckAt = new Date().toISOString();
  for (const m of b.messages) {
    if (m.author === "partner" && m.status !== "read") {
      m.status = "read";
    }
  }
  notify();
}

export function getThreadSequence(conversationId: string): number {
  return bucket(conversationId).sequence;
}

export function resetCommerceMessagingThreadStore(): void {
  buckets.clear();
  notify();
}
