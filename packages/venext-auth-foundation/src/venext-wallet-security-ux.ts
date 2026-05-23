import {
  sanitizeCommerceFoundationText,
  type CommerceFoundationFlags,
} from "commerce-foundation-guardrails";

import type { WalletSecurityFlags } from "./venext-wallet-security.types";

function toGuardrailFlags(flags: WalletSecurityFlags): CommerceFoundationFlags {
  return {
    commerce_anti_erp_wording_enabled: flags.commerce_anti_erp_wording_enabled,
  };
}

const SECURITY_JARGON =
  /\b(token expired|authentication failed|secure enclave|compliance mode|session revoked|mfa|oauth)\b/gi;

export const WALLET_SECURED_UX_LABELS = {
  sessionTitle: "Session sécurisée",
  confirmAccess: "Confirmez votre accès",
  quickAccess: "Accès rapide sécurisé",
  pinPrompt: "Entrez votre code à 4 chiffres pour accéder à vos règlements.",
  unlockAction: "Confirmer",
  biometricAction: "Accès rapide sécurisé",
} as const;

export function sanitizeWalletSecurityUxText(
  text: string,
  flags: WalletSecurityFlags = {},
): string {
  const softened = text.replace(SECURITY_JARGON, WALLET_SECURED_UX_LABELS.sessionTitle);
  return sanitizeCommerceFoundationText(softened, toGuardrailFlags(flags));
}

export function walletSecuredSessionTitle(flags?: WalletSecurityFlags): string {
  return sanitizeWalletSecurityUxText(WALLET_SECURED_UX_LABELS.sessionTitle, flags);
}

export function walletSecuredConfirmAccessLabel(flags?: WalletSecurityFlags): string {
  return sanitizeWalletSecurityUxText(WALLET_SECURED_UX_LABELS.confirmAccess, flags);
}

export function walletSecuredPinPrompt(flags?: WalletSecurityFlags): string {
  return sanitizeWalletSecurityUxText(WALLET_SECURED_UX_LABELS.pinPrompt, flags);
}
