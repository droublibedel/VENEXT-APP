export type UxVocabularyViolation = {
  file: string;
  line: number;
  column: number;
  patternId: string;
  excerpt: string;
};

export const UX_INTERNAL_VOCABULARY_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "fallback_word", pattern: /\bfallback\b/i },
  { id: "runtime_word", pattern: /\bruntime\b/i },
  { id: "terrain_rapide", pattern: /inscription\s+terrain\s+rapide|terrain\s+rapide/i },
  { id: "profil_principal", pattern: /profil\s+principal/i },
  { id: "demo_enriched", pattern: /données\s+de\s+démonstration\s+enrichies/i },
  { id: "demo_data", pattern: /données\s+de\s+démonstration\b/i },
  { id: "sync_data_label", pattern: /données\s+synchronisées/i },
  { id: "reseau_synchronise", pattern: /réseau\s+synchronisé/i },
  { id: "pas_de_fiche", pattern: /pas\s+de\s+fiche\s+entreprise/i },
  { id: "photo_logo_non_requis", pattern: /photo\s+et\s+logo\s+non\s+requis/i },
  { id: "un_seul_nom", pattern: /un\s+seul\s+nom\s*—/i },
  { id: "aucune_action_attente", pattern: /aucune\s+action\s+en\s+attente/i },
  { id: "mise_a_jour_disponible", pattern: /mise\s+à\s+jour\s+disponible/i },
  { id: "profil_en_cache", pattern: /profil\s+en\s+cache/i },
  { id: "venext_terrain_brand", pattern: /VENEXT\s+Terrain/i },
  { id: "mock_data_ui", pattern: /\bmock\b/i },
  { id: "seed_data_ui", pattern: /\bseed\b/i },
  { id: "feature_flag_ui", pattern: /feature\s+flag/i },
  { id: "persistence_mode_ui", pattern: /persistence\s+mode/i },
  { id: "sync_engine_ui", pattern: /sync\s+engine/i },
  { id: "local_cache_ui", pattern: /local\s+cache/i },
  { id: "bff_ui", pattern: /\bBFF\b/ },
  { id: "dev_badge", pattern: />\s*DEV\s*</ },
];

const TECHNICAL_LITERAL =
  /^(true|false|null|undefined|fallback|live|mixed|offline|all|form|orders|catalog|wallet|dashboard|messaging|profile|phone|identity|activities|city|detaillant|grossiste_b|grossiste-b|DETAILLANT|GROSSISTE_B)$/i;

const STRING_LITERAL =
  /(["'`])((?:\\.|(?!\1)[^\\])*)(\1)/g;

function lineColumn(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index);
  const lines = before.split("\n");
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

export function auditUiStringLiteral(
  literal: string,
  patterns: Array<{ id: string; pattern: RegExp }> = UX_INTERNAL_VOCABULARY_PATTERNS,
): string[] {
  const hits: string[] = [];
  for (const { id, pattern } of patterns) {
    if (pattern.test(literal)) hits.push(id);
  }
  return hits;
}

function isLikelyUserVisibleCopy(literal: string, line: string): boolean {
  const trimmed = line.trim();
  if (/^\s*import\s/.test(trimmed) || /\bfrom\s+["']/.test(trimmed)) return false;
  if (
    /dataSource|data-testid|data-fallback|className|testId|variant=|type=|provider\s*:|\/api\//.test(line) &&
    !/[À-ÿ]/.test(literal)
  ) {
    return false;
  }
  if (/[/\\]/.test(literal) && /\.(tsx?|jsx?|css|json)|node_modules|\/api\//i.test(literal)) return false;
  if (TECHNICAL_LITERAL.test(literal)) return false;
  if (/^[\w.-]+$/.test(literal) && literal.length < 20) return false;
  if (!/[À-ÿa-zA-Z]{4,}/.test(literal)) return false;
  return true;
}

export function auditUiFileContent(
  filePath: string,
  content: string,
): UxVocabularyViolation[] {
  const violations: UxVocabularyViolation[] = [];
  const lines = content.split("\n");
  STRING_LITERAL.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = STRING_LITERAL.exec(content)) !== null) {
    const literal = match[2] ?? "";
    if (literal.length < 4) continue;
    const { line, column } = lineColumn(content, match.index);
    const sourceLine = lines[line - 1] ?? "";
    if (!isLikelyUserVisibleCopy(literal, sourceLine)) continue;
    const patternIds = auditUiStringLiteral(literal);
    if (!patternIds.length) continue;
    for (const patternId of patternIds) {
      violations.push({
        file: filePath,
        line,
        column,
        patternId,
        excerpt: literal.slice(0, 120),
      });
    }
  }
  return violations;
}
