export const COMMERCE_FOUNDATION_ERRORS = {
  relationNotFound: "Relation introuvable pour cette action.",
  catalogUnavailable: "Catalogue non disponible pour ce partenaire.",
  orderNotAccessible: "Commande non accessible.",
  settlementNotAllowed: "Règlement non autorisé dans ce contexte.",
  formalSessionExpired: "Session expirée — reconnectez-vous.",
  walletNotActivated: "Activez d'abord vos règlements pour continuer.",
  contextUnavailable: "Contexte commercial indisponible pour le moment.",
} as const;

export type CommerceFoundationErrorCode = keyof typeof COMMERCE_FOUNDATION_ERRORS;

export function commerceFoundationUxError(code: CommerceFoundationErrorCode): string {
  return COMMERCE_FOUNDATION_ERRORS[code];
}
