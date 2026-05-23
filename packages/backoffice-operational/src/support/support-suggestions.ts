import type { BackofficeErrorEvent } from "../types/error.types.js";
import type { BackofficeJourneyInstance } from "../types/journey.types.js";
import type { BackofficeSupportTicket } from "../types/support.types.js";

export type SupportSuggestion =
  | "contact_client"
  | "retry_operation"
  | "verify_relation"
  | "verify_invitation"
  | "verify_network"
  | "reactivate_access"
  | "restart_onboarding";

export function generateSupportSuggestion(input: {
  ticket?: Partial<BackofficeSupportTicket>;
  error?: BackofficeErrorEvent;
  journey?: BackofficeJourneyInstance;
}): { suggestion: SupportSuggestion; labelFr: string } {
  const errorType = input.error?.errorType;
  const journeyKey = input.journey?.journeyKey;
  const status = input.journey?.status;

  if (errorType === "network_unstable" || errorType === "api_unavailable") {
    return { suggestion: "verify_network", labelFr: "Vérifier la connectivité réseau du client" };
  }
  if (errorType === "otp_invalid" || errorType === "password_incorrect") {
    return { suggestion: "retry_operation", labelFr: "Proposer une nouvelle tentative de connexion" };
  }
  if (errorType === "access_suspended") {
    return { suggestion: "reactivate_access", labelFr: "Vérifier suspension et réactiver si légitime" };
  }
  if (journeyKey === "enterprise_invitation" && status !== "COMPLETED") {
    return { suggestion: "verify_invitation", labelFr: "Vérifier invitation entreprise (expiration, lien)" };
  }
  if (journeyKey === "terrain_onboarding" && status === "ABANDONED") {
    return { suggestion: "restart_onboarding", labelFr: "Relancer onboarding terrain avec le client" };
  }
  if (errorType === "wallet_locked" || journeyKey === "wallet_activation") {
    return { suggestion: "contact_client", labelFr: "Contacter le client — sujet wallet sensible" };
  }
  if (input.ticket?.source === "AUTO_JOURNEY") {
    return { suggestion: "verify_relation", labelFr: "Vérifier relation commerciale et contexte actif" };
  }

  return { suggestion: "contact_client", labelFr: "Contacter le client pour comprendre le blocage" };
}
