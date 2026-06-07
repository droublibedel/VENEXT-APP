/** @vitest-environment node */
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { auditUiFileContent } from "./ux-internal-vocabulary-audit.js";
import { runUXInternalVocabularyAudit } from "./ux-internal-vocabulary-scan.js";
import { terrainOnboardingProgressLabel } from "../onboarding/terrain-onboarding-copy.js";

const REPO_ROOT = resolve(import.meta.dirname, "../../../..");

describe("UXInternalVocabularyAudit (VENEXT-UX-CLEANUP-01)", () => {
  it("rejects known internal onboarding copy in literals", () => {
    const hits = auditUiFileContent(
      "fixture.tsx",
      `export function Fixture() {
  return <p>{"Étape 1 / 5 — inscription terrain rapide"}</p>;
}`,
    );
    expect(hits.some((h) => h.patternId === "terrain_rapide")).toBe(true);
  });

  it("passes premium onboarding progress labels", () => {
    expect(terrainOnboardingProgressLabel(3, "identity")).toBe("Étape 3 sur 5 — Votre identité");
    const hits = auditUiFileContent("ok.tsx", `"${terrainOnboardingProgressLabel(3, "identity")}"`);
    expect(hits).toHaveLength(0);
  });

  it("scans commerce UI roots without forbidden vocabulary", () => {
    const { ok, violations } = runUXInternalVocabularyAudit(REPO_ROOT);
    if (!ok) {
      const sample = violations
        .slice(0, 12)
        .map((v) => `${v.file}:${v.line} [${v.patternId}] ${v.excerpt}`)
        .join("\n");
      expect.fail(`Forbidden UX vocabulary:\n${sample}`);
    }
    expect(ok).toBe(true);
  });
});

