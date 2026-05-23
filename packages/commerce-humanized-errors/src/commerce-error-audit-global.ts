import { isTechnicalErrorVisible } from "./commerce-humanized-errors";

export type GlobalHumanizedAuditIssue = {
  source: string;
  line?: number;
  snippet: string;
  rule: string;
};

/** Patterns techniques interdits à l’écran (Instruction 20.84-B). */
export const GLOBAL_FORBIDDEN_VISIBLE_PATTERNS: { id: string; pattern: RegExp; rule: string }[] = [
  { id: "http-404", pattern: /\bHTTP\s+404\b|\b404\s+not\s+found\b/i, rule: "Code HTTP 404 visible" },
  { id: "http-500", pattern: /\bHTTP\s+500\b|\b500\s+internal\b/i, rule: "Code HTTP 500 visible" },
  { id: "http-401", pattern: /\bHTTP\s+401\b|\b401\s+unauthorized\b/i, rule: "Code HTTP 401 visible" },
  { id: "http-403", pattern: /\bHTTP\s+403\b|\b403\s+forbidden\b/i, rule: "Code HTTP 403 visible" },
  { id: "network-error", pattern: /Network Error/i, rule: "Network Error brut" },
  { id: "unauthorized", pattern: /\bUnauthorized\b/i, rule: "Unauthorized brut" },
  { id: "forbidden", pattern: /\bForbidden\b/i, rule: "Forbidden brut" },
  { id: "undefined-null", pattern: /\b(undefined|null)\b.*\b(is not|cannot)\b/i, rule: "undefined/null technique" },
  { id: "cannot-read", pattern: /cannot read propert/i, rule: "Cannot read property" },
  { id: "unexpected-token", pattern: /unexpected token/i, rule: "Unexpected token" },
  { id: "stack", pattern: /\bat\s+[\w.]+\s*\(/, rule: "Stack trace visible" },
  { id: "trace", pattern: /\bstack\s*trace\b/i, rule: "Stack trace label" },
  { id: "exception", pattern: /\bexception\b.*\bat\b/i, rule: "Exception technique" },
  { id: "alert-raw", pattern: /\balert\s*\([^)]*(\.text\(\)|error\.message|JSON\.stringify)/, rule: "alert() avec texte brut" },
  { id: "error-message-ui", pattern: /\{[^}]*error\.message[^}]*\}/, rule: "error.message rendu en UI" },
  { id: "json-stringify-err", pattern: /JSON\.stringify\s*\(\s*error/, rule: "JSON.stringify(error) visible" },
  { id: "prisma", pattern: /\bPrismaClient\w*Error\b|\bprisma error\b/i, rule: "Prisma visible" },
  { id: "zod", pattern: /\bZodError\b|\bzod validation failed\b/i, rule: "Zod visible" },
  { id: "axios", pattern: /\baxios error\b|\bAxiosError\b/i, rule: "Axios visible" },
  { id: "fraud-rejected", pattern: /\b(fraud|rejected|authentication failed|critical error)\b/i, rule: "Wording wallet agressif" },
  {
    id: "catch-raw-message",
    pattern: /set(?:Error|Err|Note)\([^)]*\b(?:e|err|error)\.message\b/,
    rule: "error.message brut dans setState UI",
  },
];

export const UI_AGGRESSIVE_PATTERNS: { id: string; pattern: RegExp; rule: string }[] = [
  { id: "bg-red", pattern: /background(?:Color)?\s*:\s*['"]?(?:#f{2}0{4}|red|rgb\(255,\s*0,\s*0)/i, rule: "Fond rouge agressif" },
  { id: "text-red-alarm", pattern: /color\s*:\s*['"]?red/i, rule: "Texte rouge alarme" },
  { id: "role-alert-danger", pattern: /role=["']alert["'][^>]*className=[^>]*danger/i, rule: "Alert danger agressif" },
  { id: "dev-only-banner", pattern: /data-testid=["']dev-error-dump/i, rule: "Dump dev visible" },
  { id: "stack-pre", pattern: /<pre[^>]*>[\s\S]*\bat\s+/i, rule: "Stack dans pre" },
];

const ALLOW_LINE =
  /humanize|humanizeCaught|readHumanizedHttp|VenextInline|VenextRecoverable|safeAsync|safeFetch|safeWallet|safeMessaging|commerce-humanized|sanitizeVisible|toHumanizedBff|userMessage|getHumanizedErrorCopy|r\.status\s*===\s*40|status:\s*40|code:\s*["'](forbidden|not_found)/i;

/**
 * Audit global obligatoire — plus opt-in (Instruction 20.84-B).
 */
export function auditGlobalHumanizedErrorsCoverage(
  sources: Record<string, string>,
): { ok: boolean; issues: GlobalHumanizedAuditIssue[] } {
  const issues: GlobalHumanizedAuditIssue[] = [];

  const skipFile =
    /[/\\]mocks[/\\]|[/\\]constants\.ts$|intelligence\.ts$|messaging-intelligence\.ts$|ai-context\.ts$|DiagnosticsSurface\.tsx$|AuditSurface\.tsx$|\.fixture\.ts$|\.viewmodel\.ts$|use-relational-cart\.ts$|\.drift\.test\.ts$|[/\\]producer-industrial[/\\]/i;

  for (const [source, content] of Object.entries(sources)) {
    if (skipFile.test(source)) continue;
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (ALLOW_LINE.test(line)) return;
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
      if (/(?:text|bg|border|from|to|ring|divide)-[\w-]*(?:401|403|404|500)(?:\/|\b)/.test(line)) {
        return;
      }
      if (source.endsWith("-api.ts")) return;
      if (/^\s*const\s+FORBIDDEN\s*=/.test(line)) return;
      if (/^\s*\/.*\/i;?\s*$/.test(line.trim())) return;
      if (line.includes("prisma/seed") || line.includes("`prisma/")) return;
      if (/^\s*\/\//.test(line.trim()) && /\b(prisma|zod|axios)\b/i.test(line)) return;
      if (/\bFORBIDDEN\b/.test(line) && /\//.test(line)) return;
      if (/sanitize\w*Text|sanitizeGrossiste|sanitizeDetaillant|sanitizeVisible/i.test(line)) return;
      if (line.includes("type:") && /\.(rejected|failed)\b/i.test(line)) return;
      if (/^\s*["'][A-Z][A-Z0-9_]*["'],?\s*$/.test(line.trim())) return;

      for (const rule of GLOBAL_FORBIDDEN_VISIBLE_PATTERNS) {
        if (rule.pattern.test(line)) {
          issues.push({
            source,
            line: idx + 1,
            snippet: line.trim().slice(0, 140),
            rule: rule.rule,
          });
        }
      }

      if (
        (line.includes("userMessage") || line.includes("children=")) &&
        isTechnicalErrorVisible(line)
      ) {
        issues.push({
          source,
          line: idx + 1,
          snippet: line.trim().slice(0, 140),
          rule: "Message potentiellement technique visible",
        });
      }
    });

    if (/\balert\s*\(/.test(content) && !/humanizeCommerceErrorMessage|extractHumanMessage/.test(content)) {
      const alertLines = lines.filter((l) => /\balert\s*\(/.test(l) && !ALLOW_LINE.test(l));
      for (const line of alertLines) {
        issues.push({
          source,
          snippet: line.trim().slice(0, 140),
          rule: "alert() sans humanisation",
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

export function auditVisibleUiErrorPatterns(
  sources: Record<string, string>,
): { ok: boolean; issues: GlobalHumanizedAuditIssue[] } {
  const issues: GlobalHumanizedAuditIssue[] = [];

  for (const [source, content] of Object.entries(sources)) {
    for (const rule of UI_AGGRESSIVE_PATTERNS) {
      if (rule.pattern.test(content)) {
        issues.push({
          source,
          snippet: content.slice(0, 120),
          rule: rule.rule,
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
