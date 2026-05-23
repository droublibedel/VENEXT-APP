import type { CommerceAccessErrorCode } from "./commerce-access-control.types";
import { MESSAGING_SUSPENDED_UX } from "./messaging-access-priority";

const MESSAGES: Record<CommerceAccessErrorCode, string> = {
  catalog_unavailable: "Catalogue non disponible",
  relation_inactive: "Relation non active",
  order_not_accessible: "Commande non accessible",
  settlement_not_allowed: "Règlement non autorisé",
  offline_action_unavailable: "Action indisponible hors connexion",
  partner_only: "Accès réservé à ce partenaire",
  wallet_not_owner: "Règlements disponibles sur votre espace uniquement",
  messaging_not_allowed: "Messagerie non disponible dans ce contexte",
  messaging_participant_suspended: MESSAGING_SUSPENDED_UX,
  mail_not_allowed: "Mail professionnel non disponible ici",
  global_catalog_forbidden: "Catalogue non disponible",
};

const FORBIDDEN_JARGON = /\b(forbidden|unauthorized|access denied|policy failed)\b/i;

export function commerceAccessUxMessage(code: CommerceAccessErrorCode): string {
  return MESSAGES[code];
}

export function sanitizeAccessErrorMessage(text: string): string {
  if (FORBIDDEN_JARGON.test(text)) {
    return "Action non disponible pour le moment";
  }
  return text;
}

export function decisionFromCode(code: CommerceAccessErrorCode): {
  allowed: false;
  errorCode: CommerceAccessErrorCode;
  userMessage: string;
} {
  return {
    allowed: false,
    errorCode: code,
    userMessage: commerceAccessUxMessage(code),
  };
}
