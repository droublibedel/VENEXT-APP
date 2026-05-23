import type { ProducerCommercialMailView, ProducerMailThread } from "./producer-commercial-mail.types";

export type ProducerMailHint = { id: string; text: string };

const FORBIDDEN =
  /chatbot|assistant ia|observatory|governance|scoring|fintech|websocket|llm|prisma|dto/i;

export function sanitizeCommercialMailText(text: string): string {
  if (FORBIDDEN.test(text)) return "Signal utile pour vos échanges commerciaux.";
  return text;
}

export function buildCommercialMailSignals(threads: ProducerMailThread[]): ProducerMailHint[] {
  const hints: ProducerMailHint[] = [];
  const unread = threads.filter((t) => t.unread);
  if (unread.length) {
    hints.push({
      id: "pms-unread",
      text: sanitizeCommercialMailText(`${unread.length} message(s) réseau non lu(s).`),
    });
  }
  const withOrder = threads.find((t) => t.orderId);
  if (withOrder) {
    hints.push({
      id: "pms-order",
      text: sanitizeCommercialMailText("Commande partenaire liée à ce mail."),
    });
  }
  return hints.slice(0, 2);
}

export function buildCommercialMailHints(view: ProducerCommercialMailView | null): ProducerMailHint[] {
  if (!view) return [];
  const hints = buildCommercialMailSignals(view.threads);
  const settlement = view.threads.find((t) => t.settlementReference);
  if (settlement) {
    hints.push({
      id: "pmh-settlement",
      text: sanitizeCommercialMailText("Règlement commercial associé."),
    });
  }
  return hints.slice(0, 3);
}

export function buildCommercialMailActivityHints(view: ProducerCommercialMailView | null): ProducerMailHint[] {
  if (!view) return [];
  return [
    {
      id: "pmah-activity",
      text: sanitizeCommercialMailText(view.activitySummary || "Activité réseau active."),
    },
    {
      id: "pmah-doc",
      text: sanitizeCommercialMailText("Document commercial reçu — pièce jointe disponible."),
    },
  ].slice(0, 2);
}
