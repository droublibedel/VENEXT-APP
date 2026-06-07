import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { auditUiFileContent, type UxVocabularyViolation } from "./ux-internal-vocabulary-audit.js";

export const UX_VOCABULARY_SCAN_ROOTS = [
  "apps/mobile-terrain-shell/src",
  "apps/mobile-detaillant/src",
  "apps/mobile-grossiste-b/src",
  "apps/web-grossiste-a/src",
  "apps/web-industrial-nextjs/src/producer-industrial",
  "apps/web-industrial-nextjs/src/commerce-messaging",
  "packages/commerce-messaging/src",
  "packages/commerce-wallet/src",
  "packages/commercial-activity-feed/src",
  "packages/commercial-network-discovery/src",
  "packages/professional-commercial-network/src",
  "packages/commerce-terrain-profile-runtime/src",
  "packages/commerce-offline-foundation/src",
  "packages/relational-commerce-catalog/src",
  "packages/relational-order-orchestration/src",
  "packages/commercial-delivery-flow/src",
] as const;

const SKIP_FILE =
  /\.(spec|test)\.(ts|tsx)$|\.d\.ts$|mock-data|mocks\/|Mock[A-Z]|\.viewmodel\.ts$|\.types\.ts$|\.api\.ts$/i;

function listSourceFiles(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      listSourceFiles(full, acc);
    } else if (/\.tsx$/.test(name) && !SKIP_FILE.test(full)) {
      acc.push(full);
    }
  }
  return acc;
}

export function scanUiSourcesForForbiddenVocabulary(
  repoRoot: string,
  roots: readonly string[] = UX_VOCABULARY_SCAN_ROOTS,
): UxVocabularyViolation[] {
  const violations: UxVocabularyViolation[] = [];
  for (const root of roots) {
    const absRoot = join(repoRoot, root);
    for (const file of listSourceFiles(absRoot)) {
      let content: string;
      try {
        content = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      const rel = relative(repoRoot, file);
      violations.push(...auditUiFileContent(rel, content));
    }
  }
  return violations;
}

export function runUXInternalVocabularyAudit(repoRoot: string): {
  ok: boolean;
  violations: UxVocabularyViolation[];
} {
  const violations = scanUiSourcesForForbiddenVocabulary(repoRoot);
  return { ok: violations.length === 0, violations };
}
