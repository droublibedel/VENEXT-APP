import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { buildIndustrialEvidenceSliceCostHeaderValue } from "@venext/shared-contracts";
import type { IndustrialEvidenceRecord } from "@venext/shared-contracts";

import { IndustrialEvidenceTraceService } from "./industrial-evidence-trace.service";
import { IndustrialLimitationService } from "./industrial-limitation.service";
import { IndustrialTrustMatrixService } from "./industrial-trust-matrix.service";

const here = dirname(fileURLToPath(import.meta.url));

function baseRecord(over: Partial<IndustrialEvidenceRecord>): IndustrialEvidenceRecord {
  return {
    evidenceId: over.evidenceId ?? "ev-base",
    evidenceType: over.evidenceType ?? "HEURISTIC_SIGNAL",
    sourcePole: over.sourcePole ?? "TEST",
    sourceBundle: over.sourceBundle ?? "B",
    sourceService: over.sourceService ?? "S",
    sourceSignals: over.sourceSignals ?? ["a"],
    derivedFrom: over.derivedFrom ?? ["d"],
    confidence: over.confidence ?? 0.5,
    trustLevel: over.trustLevel ?? "WEAK_HEURISTIC",
    explanation: over.explanation ?? "e",
    limitations: over.limitations ?? "l",
    createdAt: over.createdAt ?? "t",
    advisoryOnly: true,
    heuristicOnly: over.heuristicOnly ?? true,
    symbolicProjection: over.symbolicProjection ?? false,
    demoOrSynthetic: over.demoOrSynthetic ?? false,
    heuristicConfidence: over.heuristicConfidence ?? true,
    confidenceDerivedFrom: over.confidenceDerivedFrom ?? "test.fixture",
    confidenceInputs: over.confidenceInputs ?? ["fixture"],
    confidenceHeuristic: over.confidenceHeuristic ?? "Heuristic confidence estimate — test fixture.",
    ...over,
  };
}

describe("Instruction 18.8A — industrial evidence credibility", () => {
  it("trust matrix classifies demo as synthetic-only", () => {
    const trust = new IndustrialTrustMatrixService();
    const level = trust.classifyRecord(
      baseRecord({
        evidenceId: "x",
        demoOrSynthetic: true,
      }),
    );
    expect(level).toBe("SYNTHETIC_DEMO_ONLY");
  });

  it("COMMAND_DERIVED with symbolicProjection does not collapse to SYMBOLIC_ONLY when heuristicConfidence is set", () => {
    const trust = new IndustrialTrustMatrixService();
    const a = trust.assessTrust(
      baseRecord({
        evidenceType: "COMMAND_DERIVED",
        sourcePole: "ECONOMIC_COMMAND",
        symbolicProjection: true,
        heuristicConfidence: true,
        confidence: 0.6,
      }),
    );
    expect(a.trustLevel).not.toBe("SYMBOLIC_ONLY");
    expect(a.trustLevel).toBe("STRONG_HEURISTIC");
    expect(a.classificationPath.some((p) => p.includes("symbolic")) || a.derivedFromFlags.symbolicOverlay).toBeTruthy();
  });

  it("buildMatrix carries trustReason, classificationPath, and derivedFromFlags", () => {
    const trust = new IndustrialTrustMatrixService();
    const rows = trust.buildMatrix(
      [
        baseRecord({
          evidenceId: "a",
          sourcePole: "POLE_A",
          evidenceType: "COMMAND_DERIVED",
          heuristicConfidence: true,
          confidence: 0.58,
          symbolicProjection: true,
        }),
        baseRecord({
          evidenceId: "b",
          sourcePole: "POLE_B",
          evidenceType: "DOMAIN_EVENT",
          heuristicConfidence: true,
          confidence: 0.9,
        }),
      ],
      "org-test-0001",
    );
    expect(rows.length).toBe(2);
    for (const r of rows) {
      expect(r.trustReason?.length).toBeGreaterThan(0);
      expect(Array.isArray(r.classificationPath)).toBe(true);
      expect(r.derivedFromFlags && typeof r.derivedFromFlags).toBe("object");
    }
    const poleA = rows.find((x) => x.scopeKey === "POLE_A");
    expect(poleA?.trustLevel).toMatch(/HEURISTIC/);
  });

  it("slice cost header semantics: cache hit vs full vs degraded", () => {
    expect(buildIndustrialEvidenceSliceCostHeaderValue(false, false)).toBe("FULL_BUNDLE_VIEW");
    expect(buildIndustrialEvidenceSliceCostHeaderValue(true, false)).toBe("CACHE_REUSED_BUNDLE_VIEW");
    expect(buildIndustrialEvidenceSliceCostHeaderValue(true, true)).toBe("DEGRADED_BUNDLE_VIEW");
    expect(buildIndustrialEvidenceSliceCostHeaderValue(false, true)).toBe("DEGRADED_BUNDLE_VIEW");
  });

  it("trace explanation avoids causal proof wording", () => {
    const traces = new IndustrialEvidenceTraceService();
    const out = traces.buildTraces(
      [
        baseRecord({
          evidenceId: "c",
          evidenceType: "COMMAND_DERIVED",
          sourcePole: "ECONOMIC_COMMAND",
          symbolicProjection: true,
          confidence: 0.6,
        }),
        baseRecord({
          evidenceId: "p",
          evidenceType: "PROPAGATION_DERIVED",
          sourcePole: "ECONOMIC_PROPAGATION",
          symbolicProjection: true,
          confidence: 0.55,
        }),
        baseRecord({
          evidenceId: "i",
          evidenceType: "SITUATION_ROOM_DERIVED",
          sourcePole: "INDUSTRIAL_SITUATION_ROOM",
          symbolicProjection: true,
          confidence: 0.5,
        }),
      ],
      "org-test-0001",
      true,
    );
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]!.traceKind).toBe("DERIVED_TRACE_NOT_CAUSAL_PROOF");
    expect(out[0]!.nonCausalTrace).toBe(true);
    expect(out[0]!.interpretationRisk?.length).toBeGreaterThan(0);
    expect(out[0]!.explanatoryBoundary?.length).toBeGreaterThan(0);
    expect(out[0]!.explanation.toLowerCase()).toMatch(/non-causal/);
    const blob = [
      out[0]!.explanation,
      out[0]!.interpretationRisk,
      out[0]!.explanatoryBoundary,
      ...out[0]!.nodes.map((n) => n.label),
    ]
      .join(" ")
      .toLowerCase();
    const banned = ["caused by", "triggered by", "chain reaction", "impact chain", "propagation proof"];
    for (const b of banned) {
      expect(blob.includes(b), `trace text should not contain "${b}"`).toBe(false);
    }
  });

  it("trace service source avoids banned causal marketing strings", () => {
    const src = readFileSync(resolve(here, "./industrial-evidence-trace.service.ts"), "utf8").toLowerCase();
    const banned = ["caused by", "triggered by", "chain reaction", "impact chain", "propagation proof"];
    for (const b of banned) {
      expect(src.includes(b), `trace service should not contain "${b}"`).toBe(false);
    }
  });

  it("limitations include incomplete_source_limit when source map entries skipped", () => {
    const lim = new IndustrialLimitationService();
    const rows = lim.build(
      [],
      "org-test-0001",
      [
        {
          poleKey: "ECONOMIC_COMMAND",
          included: false,
          composeHint: "Skipped",
          skippedReason: "flag_off",
          sourceFreshness: "NOT_INCLUDED",
          sourceReliability: "FLAG_DISABLED",
          sourceCompleteness: "ROW_SKIP",
          sourceAvailability: "UNAVAILABLE_FLAG",
        },
      ],
    );
    expect(rows.some((r) => r.limitationType === "incomplete_source_limit")).toBe(true);
  });
});
