import type { CommerceMessage } from "../hooks/commerce-messaging.types.js";

export type MessageDateGroupLabel = "Aujourd'hui" | "Hier" | string;

export type GroupedCommerceMessage = {
  groupLabel: MessageDateGroupLabel;
  messages: CommerceMessage[];
};

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatMessageClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function resolveDateGroupLabel(iso: string, now = new Date()): MessageDateGroupLabel {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = startOfLocalDay(now);
  const msgDay = startOfLocalDay(d);
  const diff = today - msgDay;
  if (diff === 0) return "Aujourd'hui";
  if (diff === 86_400_000) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/** Regroupe par date (Aujourd'hui / Hier / date) — heure affichée sous chaque bulle. */
export function groupMessagesByDate(messages: CommerceMessage[]): GroupedCommerceMessage[] {
  const visible = messages.filter((m) => !m.deletedGlobally);
  const groups: GroupedCommerceMessage[] = [];
  let currentLabel: MessageDateGroupLabel | null = null;

  for (const m of visible) {
    const label = resolveDateGroupLabel(m.at);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ groupLabel: label, messages: [] });
    }
    groups[groups.length - 1]!.messages.push({
      ...m,
      displayTime: formatMessageClock(m.at),
    });
  }
  return groups;
}
