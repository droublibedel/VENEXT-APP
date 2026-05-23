import type { CommerceFoundationFlags } from "./commerce-foundation-philosophy.guard";

/** ERP / supply chain / fintech / social terms → commerce-first replacements (Instruction 20.74-A). */
const ERP_SUPPLY_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\bwarehouse\b/gi, replacement: "préparation" },
  { pattern: /\bpicking\b/gi, replacement: "préparation commande" },
  { pattern: /\ballocation\b/gi, replacement: "circulation produit" },
  { pattern: /\bASN\b/g, replacement: "confirmation terrain" },
  { pattern: /\blogistics center\b/gi, replacement: "activité corridor" },
  { pattern: /\binventory allocation\b/gi, replacement: "circulation produit" },
  { pattern: /\bshipment tracking\b/gi, replacement: "progression commande" },
  { pattern: /\bsupply chain operations\b/gi, replacement: "flux commercial" },
  { pattern: /\blogistics management\b/gi, replacement: "activité commerciale" },
  { pattern: /\bERP workflow\b/gi, replacement: "flux commercial" },
  { pattern: /\bticket escalation\b/gi, replacement: "activité partenaire" },
  { pattern: /\bTMS\b/g, replacement: "livraison" },
  { pattern: /\bWMS\b/g, replacement: "préparation" },
  { pattern: /\bsupply chain\b/gi, replacement: "flux commercial" },
  { pattern: /\berp\b/gi, replacement: "activité commerciale" },
];

const FINTECH_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\bbanking dashboard\b/gi, replacement: "activité règlement" },
  { pattern: /\bwallet balance sheet\b/gi, replacement: "règlement partenaire" },
  { pattern: /\btrading\b/gi, replacement: "échange commercial" },
  { pattern: /\bfintech\b/gi, replacement: "règlement relationnel" },
  { pattern: /\bassistant\b/gi, replacement: "partenaire" },
  { pattern: /\bscoring financier\b/gi, replacement: "activité partenaire" },
  { pattern: /\bbanque numérique\b/gi, replacement: "règlement partenaire" },
];

const SOCIAL_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\bfeed discussion\b/gi, replacement: "conversation partenaire" },
  { pattern: /\bchat communautaire\b/gi, replacement: "messagerie commerce" },
  { pattern: /\bréseau social\b/gi, replacement: "réseau commercial" },
  { pattern: /\breactions sociales\b/gi, replacement: "échanges partenaires" },
  { pattern: /\bprésence sociale\b/gi, replacement: "activité partenaire" },
];

const ANALYTICS_JARGON =
  /\b(scoring|algorithme|ia prédictive|marketplace globale|observatory|orchestration executive)\b/gi;

const DEFAULT_REPLACEMENT = "activité commerciale";

export function isCommerceAntiErpWordingEnabled(flags: CommerceFoundationFlags = {}): boolean {
  return flags.commerce_anti_erp_wording_enabled !== false;
}

export function sanitizeCommerceFoundationText(
  text: string,
  flags: CommerceFoundationFlags = {},
): string {
  if (!text?.trim()) return text;
  if (!isCommerceAntiErpWordingEnabled(flags)) return text.trim();

  let out = text.trim();

  for (const { pattern, replacement } of [
    ...ERP_SUPPLY_PATTERNS,
    ...FINTECH_PATTERNS,
    ...SOCIAL_PATTERNS,
  ]) {
    out = out.replace(pattern, replacement);
  }

  if (ANALYTICS_JARGON.test(out)) {
    out = DEFAULT_REPLACEMENT;
  }

  return out.replace(/\s{2,}/g, " ").trim();
}

export function containsForbiddenEnterpriseWording(text: string): boolean {
  const probe = text.toLowerCase();
  const forbidden = [
    "warehouse",
    "picking",
    "asn",
    "tms",
    "wms",
    "erp workflow",
    "banking dashboard",
    "supply chain operations",
    "réseau social",
    "chat communautaire",
  ];
  return forbidden.some((f) => probe.includes(f));
}

export function assertCommerceFoundationWording(text: string, flags?: CommerceFoundationFlags): string {
  return sanitizeCommerceFoundationText(text, flags);
}
