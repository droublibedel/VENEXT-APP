import {
  getGrossisteAPoleBusinessContent,
  isDecorativeKpi,
  listGrossisteAPoleBusinessContents,
  poleContentMeetsMinimum,
  type GrossisteAPoleBusinessContent,
} from "./grossiste-a-pole-content";
import { GROSSISTE_A_CANONICAL_POLES } from "./grossiste-a-canonical-poles";
import { assertCrossPoleCoherence, buildSharedCommerceSignals } from "./grossiste-a-commerce-signals";

export type PoleContentAuditIssue = {
  pole: string;
  code: string;
  detail: string;
};

export function auditEnterprisePoleContentIntegrity(input?: {
  contents?: GrossisteAPoleBusinessContent[];
  sharedSignals?: ReturnType<typeof buildSharedCommerceSignals>;
}): { ok: boolean; issues: PoleContentAuditIssue[] } {
  const contents = input?.contents ?? listGrossisteAPoleBusinessContents();
  const issues: PoleContentAuditIssue[] = [];

  if (contents.length !== GROSSISTE_A_CANONICAL_POLES.length) {
    issues.push({
      pole: "*",
      code: "pole_count",
      detail: `Attendu ${GROSSISTE_A_CANONICAL_POLES.length} pôles, reçu ${contents.length}`,
    });
  }

  for (const content of contents) {
    if (!poleContentMeetsMinimum(content)) {
      issues.push({
        pole: content.pole,
        code: "empty_dashboard",
        detail: "Signaux métier insuffisants ou vides",
      });
    }
    for (const signal of content.signals) {
      if (isDecorativeKpi(signal.label)) {
        issues.push({
          pole: content.pole,
          code: "decorative_kpi",
          detail: `KPI décoratif: ${signal.label}`,
        });
      }
      if (!signal.label.trim()) {
        issues.push({ pole: content.pole, code: "empty_widget", detail: "Signal sans libellé" });
      }
    }
    if (content.actions.length === 0) {
      issues.push({
        pole: content.pole,
        code: "no_actions",
        detail: "Aucune action métier",
      });
    }
  }

  const shared =
    input?.sharedSignals ??
    buildSharedCommerceSignals({ lateOrderCount: 1, pendingOrders: 2, pendingSettlements: 1 });
  if (!assertCrossPoleCoherence(shared)) {
    issues.push({
      pole: "*",
      code: "cross_pole",
      detail: "Signal commande retardée non propagé entre ADV et Livraison",
    });
  }

  for (const pole of GROSSISTE_A_CANONICAL_POLES) {
    const template = getGrossisteAPoleBusinessContent(pole);
    if (template.subtitle.includes("ERP") || template.title.includes("cockpit")) {
      issues.push({
        pole,
        code: "wrong_wording",
        detail: "Vocabulaire industriel inadapté",
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
