import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

import type { CommerceErrorStateKey } from "./commerce-ux-harmony.types";

const FR: Record<CommerceErrorStateKey, string> = {
  access_denied: "Accès réservé à ce partenaire",
  wallet_inactive: "Activez vos règlements pour continuer",
  session_locked: "Session verrouillée — reconnectez-vous",
  offline: "Action indisponible hors connexion",
  relation_inactive: "Relation non active",
  generic: "Action non disponible pour le moment",
};

const EN: Partial<Record<CommerceErrorStateKey, string>> = {
  access_denied: "Access reserved for this partner",
  offline: "Unavailable while offline",
  generic: "Action unavailable right now",
};

const BY_LOCALE: Record<string, Record<CommerceErrorStateKey, string>> = {
  "fr-CI": FR,
  fr: FR,
  en: { ...FR, ...EN },
  ar: { ...FR, access_denied: "الوصول مخصص لهذا الشريك" },
  "zh-CN": { ...FR, generic: "当前无法执行此操作" },
};

const FORBIDDEN_VISIBLE = /\b(forbidden|unauthorized|access denied|stack trace|error 40\d)\b/i;

export function getErrorStateMessage(key: CommerceErrorStateKey, locale = "fr-CI"): string {
  const dict = BY_LOCALE[locale] ?? BY_LOCALE[locale.split("-")[0] ?? ""] ?? FR;
  let text = dict[key] ?? FR.generic;
  if (FORBIDDEN_VISIBLE.test(text)) text = FR.generic;
  return sanitizeCommerceFoundationText(text);
}
