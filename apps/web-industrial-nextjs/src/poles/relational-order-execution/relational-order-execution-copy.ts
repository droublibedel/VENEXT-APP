/** Instruction 20.8A — user-visible copy (French). Avoid consumer checkout / public-tracking phrasing. */

export function relationExecutionStatusHeadline(status: string): string {
  switch (status) {
    case "CANCELLED":
      return "Exécution annulée";
    case "BLOCKED":
      return "Exécution bloquée";
    case "PARTIALLY_FULFILLED":
      return "Exécution partielle à vérifier";
    default:
      return status;
  }
}

export function relationExecutionEventHeadline(eventType: string): string {
  switch (eventType) {
    case "EXECUTION_CANCELLED":
      return "Exécution annulée";
    case "EXECUTION_BLOCKED":
      return "Exécution bloquée";
    default:
      return eventType;
  }
}

export function relationOrderRealtimeEnvelopeLabel(envelope: string): string {
  if (envelope === "relational.order.cancelled") return "Annulation corridor (temps réel)";
  if (envelope === "relational.order.blocked") return "Blocage opérationnel (temps réel)";
  return envelope;
}
