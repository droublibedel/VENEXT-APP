export type VenextVisualAuditIssue = {
  source: string;
  line?: number;
  snippet: string;
  rule: string;
};

const VISUAL_RULES: { id: string; pattern: RegExp; rule: string }[] = [
  { id: "spinner-only", pattern: />\s*<Spinner|CircularProgress|animate-spin[^>]*>\s*<\/div>\s*$/m, rule: "Spinner seul sans skeleton" },
  {
    id: "loading-text-only",
    pattern: /Chargement[.…]|Loading\.\.\.|>Loading<|>Chargement[^<]{0,40}</,
    rule: "Texte chargement seul sans skeleton",
  },
  { id: "border-radius-0", pattern: /border-radius:\s*0|rounded-none/, rule: "Angle agressif (radius 0)" },
  { id: "dense-form", pattern: /gap:\s*[0-3]px.*input|flex-col[^}]{0,80}gap:\s*4px/, rule: "Formulaire dense" },
  { id: "dashboard-cram", pattern: /grid-template-columns:\s*repeat\(\s*6/, rule: "Dashboard surchargé (6+ colonnes KPI)" },
  { id: "shimmer-aggressive", pattern: /shimmer|linear-gradient\([^)]*transparent[^)]*animation/i, rule: "Shimmer agressif" },
  { id: "icon-mix", pattern: /react-icons\/fa.*lucide-react|heroicons.*material-icons/i, rule: "Mélange bibliothèques icônes" },
  { id: "typography-tiny", pattern: /font-size:\s*[89]px|text-\[8px\]/, rule: "Typographie illisible" },
  { id: "fake-skeleton", pattern: /skeleton.*placeholder.*block.*h-4.*w-full(?!.*venext-skeleton)/i, rule: "Skeleton générique incohérent" },
];

const ALLOW_LINE =
  /venext-skeleton|VenextSkeleton|aria-busy|prefers-reduced-motion|venext-skeleton-pulse/i;

/**
 * Audit cohérence visuelle VENEXT (Instruction 20.87).
 */
export function auditVenextVisualConsistency(
  sources: Record<string, string>,
): { ok: boolean; issues: VenextVisualAuditIssue[] } {
  const issues: VenextVisualAuditIssue[] = [];

  for (const [source, content] of Object.entries(sources)) {
    if (/\.spec\.|\.test\.|node_modules/.test(source)) continue;
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (ALLOW_LINE.test(line)) return;
      if (line.trim().startsWith("//")) return;
      for (const rule of VISUAL_RULES) {
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

/** Vérifie que les tokens spacing/radius sont monotones. */
export function validateVenextDesignTokenIntegrity(spacing: Record<string, number>, radius: Record<string, number>): boolean {
  const sVals = Object.values(spacing);
  const rVals = Object.values(radius);
  for (let i = 1; i < sVals.length; i += 1) {
    if (sVals[i]! < sVals[i - 1]!) return false;
  }
  for (let i = 1; i < rVals.length; i += 1) {
    if (rVals[i]! < rVals[i - 1]!) return false;
  }
  return true;
}
