import type { GrossisteACanonicalPole } from "./grossiste-a-canonical-poles";

type LocaleKey = "fr-CI" | "en" | "ar" | "zh";

const POLE_LABELS: Record<GrossisteACanonicalPole, Record<LocaleKey, string>> = {
  PILOTAGE_COMMERCIAL: {
    "fr-CI": "Pilotage commercial",
    en: "Commercial steering",
    ar: "قيادة تجارية",
    zh: "商务驾驶",
  },
  RESEAU_DISTRIBUTION: {
    "fr-CI": "Réseau & distribution",
    en: "Network & distribution",
    ar: "الشبكة والتوزيع",
    zh: "网络与分销",
  },
  COMMANDES_ADV: {
    "fr-CI": "Commandes & ADV",
    en: "Orders & ADV",
    ar: "الطلبات والمتابعة",
    zh: "订单与商务跟进",
  },
  LIVRAISON_RECEPTION: {
    "fr-CI": "Livraison & réception",
    en: "Delivery & reception",
    ar: "التسليم والاستلام",
    zh: "配送与收货",
  },
  FINANCE_REGLEMENTS: {
    "fr-CI": "Finance & règlements",
    en: "Finance & settlements",
    ar: "المالية والتسويات",
    zh: "财务与结算",
  },
  RELATIONS_PARTENAIRES: {
    "fr-CI": "Relations partenaires",
    en: "Partner relations",
    ar: "علاقات الشركاء",
    zh: "合作伙伴关系",
  },
  SECURITE_GOUVERNANCE: {
    "fr-CI": "Sécurité & gouvernance",
    en: "Security & governance",
    ar: "الأمن والحوكمة",
    zh: "安全与治理",
  },
};

const IDENTITY: Record<string, Record<LocaleKey, string>> = {
  "grossiste_a.tagline": {
    "fr-CI": "Distributeur structuré — orchestration territoriale",
    en: "Structured distributor — territorial orchestration",
    ar: "موزع منظم — تنسيق إقليمي",
    zh: "结构化分销商 — 区域协调",
  },
  "grossiste_a.not_producer": {
    "fr-CI": "Espace distribution — pas de pilotage usine",
    en: "Distribution workspace — not a factory cockpit",
    ar: "مساحة توزيع — ليست قيادة مصنع",
    zh: "分销空间 — 非工厂驾驶舱",
  },
  "grossiste_a.dashboard.subtitle": {
    "fr-CI": "Supervision réseau, commandes et règlements",
    en: "Network, orders and settlement supervision",
    ar: "إشراف على الشبكة والطلبات والتسويات",
    zh: "网络、订单与结算监督",
  },
  "grossiste_a.workspace.network_activity": {
    "fr-CI": "Activité réseau",
    en: "Network activity",
    ar: "نشاط الشبكة",
    zh: "网络活动",
  },
  "grossiste_a.pole.pilotage": {
    "fr-CI": "Vue consolidée de l'activité commerciale",
    en: "Consolidated commercial activity view",
    ar: "نظرة موحدة على النشاط التجاري",
    zh: "商业活动总览",
  },
};

function pickLocale(locale: string): LocaleKey {
  if (locale.startsWith("ar")) return "ar";
  if (locale.startsWith("zh")) return "zh";
  if (locale.startsWith("en")) return "en";
  return "fr-CI";
}

export function getGrossisteAPoleLabel(pole: GrossisteACanonicalPole, locale = "fr-CI"): string {
  return POLE_LABELS[pole][pickLocale(locale)];
}

export function getGrossisteAIdentityCopy(key: string, locale = "fr-CI"): string {
  const row = IDENTITY[key];
  if (!row) return key;
  return row[pickLocale(locale)] ?? row["fr-CI"];
}
