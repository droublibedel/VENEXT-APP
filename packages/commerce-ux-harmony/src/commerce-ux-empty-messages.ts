import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

import type { CommerceEmptyStateKey, CommerceUxActorKind } from "./commerce-ux-harmony.types";

const FR: Record<CommerceEmptyStateKey, string> = {
  catalog: "Aucun catalogue relationnel pour le moment",
  orders: "Aucune commande récente",
  notifications: "Aucune notification",
  deliveries: "Aucune livraison en cours",
  relations: "Aucune relation active",
  messages: "Aucun message récent",
  wallet: "Règlements non encore activés",
  activity: "Aucune activité récente",
  offline: "Contenu disponible après synchronisation",
  generic: "Rien à afficher pour l'instant",
};

const EN: Partial<Record<CommerceEmptyStateKey, string>> = {
  catalog: "No relational catalog yet",
  orders: "No recent orders",
  notifications: "No notifications",
  generic: "Nothing to show yet",
};

const AR: Partial<Record<CommerceEmptyStateKey, string>> = {
  catalog: "لا يوجد كتالوج بعد",
  generic: "لا شيء لعرضه الآن",
};

const ZH: Partial<Record<CommerceEmptyStateKey, string>> = {
  catalog: "暂无关系目录",
  generic: "暂无内容",
};

const BY_LOCALE: Record<string, Record<CommerceEmptyStateKey, string>> = {
  "fr-CI": FR,
  fr: FR,
  en: { ...FR, ...EN },
  ar: { ...FR, ...AR },
  "zh-CN": { ...FR, ...ZH },
  zh: { ...FR, ...ZH },
};

export function getEmptyStateMessage(
  key: CommerceEmptyStateKey,
  locale = "fr-CI",
  _actorKind: CommerceUxActorKind = "terrain",
): string {
  const dict = BY_LOCALE[locale] ?? BY_LOCALE[locale.split("-")[0] ?? ""] ?? FR;
  return sanitizeCommerceFoundationText(dict[key] ?? FR.generic);
}
