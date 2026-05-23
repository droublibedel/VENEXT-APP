/** Instruction 20.9 — industrial B2B fulfillment copy (no consumer delivery vocabulary). */

export function fulfillmentStatusHeadline(status: string): string {
  switch (status) {
    case "RECEPTION_VALIDATED":
      return "Réception commerciale validée";
    case "RECEPTION_PARTIALLY_VALIDATED":
      return "Réception partielle à vérifier";
    case "RECEPTION_REJECTED":
      return "Réception refusée (corridor)";
    case "FULFILLMENT_BLOCKED":
      return "Fulfillment relationnel bloqué";
    case "FULFILLMENT_COMPLETED":
      return "Fulfillment relationnel terminé";
    case "INCIDENT_REPORTED":
      return "Incident opérationnel signalé";
    case "ARRIVED_AT_DESTINATION":
      return "Arrivée destination corridor";
    case "IN_TRANSFER":
      return "Transfert inter-partenaires en cours";
    case "LOADING_CONFIRMED":
      return "Chargement confirmé";
    case "READY_FOR_LOADING":
      return "Prêt pour chargement";
    default:
      return status;
  }
}
