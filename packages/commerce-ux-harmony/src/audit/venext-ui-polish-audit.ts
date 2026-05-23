export type VenextUiPolishIssue = {
  source: string;
  line?: number;
  snippet: string;
  rule: string;
};

const POLISH_RULES: { pattern: RegExp; rule: string }[] = [
  { pattern: /overflow:\s*visible[^;]*width:\s*100vw/, rule: "Risque overflow horizontal" },
  { pattern: /margin-left:\s*-\d|margin-right:\s*-\d/, rule: "Alignement cassé (marge négative)" },
  { pattern: /border-radius:\s*9999px.*border-radius:\s*0/, rule: "Radius incohérent" },
  { pattern: /padding:\s*0[^0-9].*className=.*p-\d/, rule: "Spacing incohérent padding" },
  { pattern: /align-items:\s*baseline.*flex-direction:\s*column/, rule: "Hiérarchie flex fragile" },
  { pattern: /z-index:\s*9999/, rule: "Bruit UI (z-index extrême)" },
  { pattern: /outline:\s*none(?!.*focus-visible)/, rule: "Focus invisible (accessibilité)" },
  { pattern: /width:\s*100%.*width:\s*100%.*width:\s*100%/, rule: "Écran dense (largeurs empilées)" },
  { pattern: /Chargement…|>Chargement[^<]*</, rule: "Loader texte visible" },
  { pattern: /gap:\s*2px.*gap:\s*2px/, rule: "Écran étouffé (gap 2px répété)" },
];

const SKIP = /venext-skeleton|VenextSkeleton|\.spec\.|node_modules|auditVenextUiPolish/i;

/**
 * QA polish UI — alignement, overflow, hierarchy (Instruction 20.87-A).
 */
export function auditVenextUiPolish(
  sources: Record<string, string>,
): { ok: boolean; issues: VenextUiPolishIssue[] } {
  const issues: VenextUiPolishIssue[] = [];

  for (const [source, content] of Object.entries(sources)) {
    if (SKIP.test(source)) continue;
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (SKIP.test(line)) return;
      for (const rule of POLISH_RULES) {
        if (rule.pattern.test(line)) {
          issues.push({
            source,
            line: idx + 1,
            snippet: line.trim().slice(0, 120),
            rule: rule.rule,
          });
        }
      }
    });
  }

  return { ok: issues.length === 0, issues };
}
