export type VenextFatigueAuditIssue = {
  source: string;
  line?: number;
  snippet: string;
  rule: string;
  severity: "low" | "medium" | "high";
};

const FATIGUE_RULES: { pattern: RegExp; rule: string; severity: VenextFatigueAuditIssue["severity"] }[] = [
  { pattern: /grid-template-columns:\s*repeat\(\s*([6-9]|\d{2,})/, rule: "Surcharge KPI (grille 6+ colonnes)", severity: "high" },
  { pattern: /repeat\(\s*auto-fit[^)]*minmax\(\s*80px/, rule: "Cartes KPI trop compactes", severity: "medium" },
  { pattern: /#fff.*#000|#000.*#fff|contrast\(\s*21/, rule: "Contraste extrême", severity: "high" },
  { pattern: /gap:\s*[0-4]px.*gap:\s*[0-4]px/, rule: "Densité excessive (gaps minimaux répétés)", severity: "medium" },
  { pattern: /box-shadow:[^;]{80,}/, rule: "Élévation visuelle lourde", severity: "low" },
  { pattern: /(venext-card|dashboard-card|kpi-card)[\s\S]{0,200}(venext-card|dashboard-card|kpi-card)[\s\S]{0,200}(venext-card|dashboard-card|kpi-card)/i, rule: "Répétition visuelle de cartes", severity: "medium" },
  { pattern: /font-weight:\s*900|font-black/, rule: "Typographie agressive", severity: "medium" },
  { pattern: /animation:\s*[^;]*infinite/, rule: "Animation continue (fatigue)", severity: "medium" },
  { pattern: /text-\[10px\]|font-size:\s*10px/, rule: "Micro-typographie fatigante", severity: "high" },
  { pattern: /grid-cols-6|grid-cols-7|grid-cols-8/, rule: "Dashboard horizontal surchargé", severity: "high" },
];

const SKIP =
  /venext-skeleton|VenextSkeleton|prefers-reduced-motion|\.spec\.|node_modules|auditVisualFatigueRisk/i;

/**
 * Audit fatigue visuelle — usage prolongé 8h/jour (Instruction 20.87-A).
 */
export function auditVisualFatigueRisk(
  sources: Record<string, string>,
): { ok: boolean; issues: VenextFatigueAuditIssue[]; highCount: number } {
  const issues: VenextFatigueAuditIssue[] = [];

  for (const [source, content] of Object.entries(sources)) {
    if (SKIP.test(source)) continue;
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (SKIP.test(line)) return;
      for (const rule of FATIGUE_RULES) {
        if (rule.pattern.test(line)) {
          issues.push({
            source,
            line: idx + 1,
            snippet: line.trim().slice(0, 120),
            rule: rule.rule,
            severity: rule.severity,
          });
        }
      }
    });
  }

  const highCount = issues.filter((i) => i.severity === "high").length;
  return { ok: highCount === 0, issues, highCount };
}
