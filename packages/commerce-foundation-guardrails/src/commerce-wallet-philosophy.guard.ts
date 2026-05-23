import { sanitizeCommerceFoundationText } from "./commerce-foundation-wording.guard";
import type { CommerceFoundationFlags } from "./commerce-foundation-philosophy.guard";

const FORBIDDEN_WALLET =
  /\b(trading|crypto|defi|yield|portfolio|balance sheet|iban dashboard|wire transfer hub|credit score|fraud(?:\s+score|\s+detection)?|chatbot|fintech|assistant|scoring|neobank|open banking api|trading desk)\b/i;

export function assertWalletNotFintech(surfaceText: string): boolean {
  return !FORBIDDEN_WALLET.test(surfaceText);
}

export function sanitizeWalletFoundationText(
  text: string,
  flags?: CommerceFoundationFlags,
): string {
  let out = sanitizeCommerceFoundationText(text, flags);
  if (FORBIDDEN_WALLET.test(out)) {
    return "Règlement partenaire — activité commerciale.";
  }
  return out;
}

export function walletPhilosophyLabels(): Record<string, string> {
  return {
    balance: "Activité règlement",
    transaction: "Mouvement partenaire",
    settlement: "Règlement relationnel",
    confirm: "Confirmation terrain",
  };
}
