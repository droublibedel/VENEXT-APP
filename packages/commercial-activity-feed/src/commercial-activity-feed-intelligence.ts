import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

import { getActivityTranslation } from "./commercial-activity-feed-i18n";
import type { CommercialActivityItem } from "./commercial-activity-feed.types";

const ERP_FORBIDDEN = /\b(erp|crm|kpi|dashboard|audit trail|workflow engine)\b/i;
const SOCIAL_FORBIDDEN = /\b(like|follow|comment|viral|trending|feed public)\b/gi;

export function sanitizeActivityText(text: string): string {
  let out = sanitizeCommerceFoundationText(text);
  if (ERP_FORBIDDEN.test(out) || SOCIAL_FORBIDDEN.test(out)) {
    out = out.replace(ERP_FORBIDDEN, "").replace(SOCIAL_FORBIDDEN, "");
    out = out.trim() || "Activité commerciale";
  }
  return out;
}

export function buildActivityLabel(item: CommercialActivityItem, locale = "fr-CI"): string {
  return sanitizeActivityText(getActivityTranslation(item.titleKey, locale));
}

export function buildActivitySummaryText(
  summaryKey: string,
  locale = "fr-CI",
  params?: Record<string, string | number>,
): string {
  let text = getActivityTranslation(summaryKey, locale);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return sanitizeActivityText(text);
}

export function buildGroupLabel(
  labelKey: string,
  count: number,
  locale = "fr-CI",
): string {
  const template = getActivityTranslation(labelKey, locale);
  return sanitizeActivityText(template.replace("{count}", String(count)));
}
