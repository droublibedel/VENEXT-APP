import type { CommerceFoundationFlags } from "./commerce-foundation-philosophy.guard";
import { sanitizeCommerceFoundationText } from "./commerce-foundation-wording.guard";

export type VenextLocaleTag = "fr-CI" | "en" | "ar" | "zh-CN" | string;

const MULTILINGUAL_ERP: { pattern: RegExp; replacement: Record<string, string> }[] = [
  {
    pattern: /\bERP\b/gi,
    replacement: {
      "fr-CI": "activité commerciale",
      en: "commercial activity",
      ar: "نشاط تجاري",
      "zh-CN": "商业活动",
    },
  },
  {
    pattern: /\bsupply chain\b/gi,
    replacement: {
      "fr-CI": "flux commercial",
      en: "commercial flow",
      ar: "تدفق تجاري",
      "zh-CN": "商业流程",
    },
  },
  {
    pattern: /\bfintech\b/gi,
    replacement: {
      "fr-CI": "règlement partenaire",
      en: "partner settlement",
      ar: "تسوية الشريك",
      "zh-CN": "伙伴结算",
    },
  },
  {
    pattern: /\bmarketplace\b/gi,
    replacement: {
      "fr-CI": "réseau partenaires",
      en: "partner network",
      ar: "شبكة الشركاء",
      "zh-CN": "伙伴网络",
    },
  },
  {
    pattern: /\bsocial network\b/gi,
    replacement: {
      "fr-CI": "réseau commercial",
      en: "commercial network",
      ar: "شبكة تجارية",
      "zh-CN": "商业网络",
    },
  },
  {
    pattern: /\bchatbot\b/gi,
    replacement: {
      "fr-CI": "assistant commerce",
      en: "commerce assistant",
      ar: "مساعد تجاري",
      "zh-CN": "商务助手",
    },
  },
  {
    pattern: /\bscoring\b/gi,
    replacement: {
      "fr-CI": "indicateur partenaire",
      en: "partner indicator",
      ar: "مؤشر الشريك",
      "zh-CN": "伙伴指标",
    },
  },
];

function pickLocale(locale: VenextLocaleTag): string {
  if (locale === "fr-CI" || locale.startsWith("fr")) return "fr-CI";
  if (locale === "zh-CN" || locale.startsWith("zh")) return "zh-CN";
  if (locale === "ar" || locale.startsWith("ar")) return "ar";
  return "en";
}

export function isMultilingualGuardrailsEnabled(
  flags: CommerceFoundationFlags & { venext_multilingual_guardrails_enabled?: boolean } = {},
): boolean {
  return flags.venext_multilingual_guardrails_enabled !== false;
}

export function sanitizeTranslatedCommerceText(
  text: string,
  locale: VenextLocaleTag = "fr-CI",
  flags: CommerceFoundationFlags & { venext_multilingual_guardrails_enabled?: boolean } = {},
): string {
  if (!text?.trim()) return text;
  let out = sanitizeCommerceFoundationText(text, flags);
  if (!isMultilingualGuardrailsEnabled(flags)) return out;

  const loc = pickLocale(locale);
  for (const { pattern, replacement } of MULTILINGUAL_ERP) {
    const rep = replacement[loc] ?? replacement.en ?? "commercial activity";
    out = out.replace(pattern, rep);
  }

  return out.replace(/\s{2,}/g, " ").trim();
}
