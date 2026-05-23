import type {
  IndustrialEvidenceRecord,
  IndustrialEvidenceSourceMapEntry,
  IndustrialLimitationRecord,
} from "@venext/shared-contracts";

import { Injectable } from "@nestjs/common";

@Injectable()
export class IndustrialLimitationService {
  build(
    records: IndustrialEvidenceRecord[],
    organizationId: string,
    sourceMap?: IndustrialEvidenceSourceMapEntry[],
  ): IndustrialLimitationRecord[] {
    const out: IndustrialLimitationRecord[] = [];
    let i = 0;
    const push = (partial: Omit<IndustrialLimitationRecord, "limitationId">) => {
      i += 1;
      out.push({ limitationId: `lim-${organizationId.slice(0, 8)}-${i}`, ...partial });
    };
    for (const r of records) {
      if (r.heuristicOnly) {
        push({
          limitationType: "heuristic_limit",
          affectedSignal: r.evidenceId,
          severity: "medium",
          explanation: "Signal rests on bounded heuristics — not calibrated industrial measurement.",
          userFacingWarning: "Heuristic-only — do not treat as ground truth.",
        });
      }
      if (r.symbolicProjection) {
        push({
          limitationType: "symbolic_projection_limit",
          affectedSignal: r.evidenceId,
          severity: "low",
          explanation: "Symbolic projection — no claim of geographic or operational ground truth.",
          userFacingWarning: "Symbolic layer — not a surveyed map.",
        });
      }
      if (r.demoOrSynthetic) {
        push({
          limitationType: "demo_signal_limit",
          affectedSignal: r.evidenceId,
          severity: "high",
          explanation: "Demo or synthetic provenance — exclude from compliance-grade evidence chains.",
          userFacingWarning: "Demo/synthetic — not domain live data.",
        });
      }
      if (r.confidence < 0.35) {
        push({
          limitationType: "non_calibrated_score_limit",
          affectedSignal: r.evidenceId,
          severity: "medium",
          explanation: "Low confidence score — treat as weak prior until domain calibration exists.",
          userFacingWarning: "Low confidence — requires industrial validation.",
        });
      }
      if (r.evidenceType === "MEMORY_DERIVED") {
        push({
          limitationType: "stale_snapshot_limit",
          affectedSignal: r.evidenceId,
          severity: "low",
          explanation: "Memory-derived signals may lag operational reality.",
          userFacingWarning: "Possible temporal lag on memory readout.",
        });
      }
    }
    if (sourceMap) {
      for (const e of sourceMap) {
        if (e.included) continue;
        i += 1;
        out.push({
          limitationId: `lim-${organizationId.slice(0, 8)}-${i}`,
          limitationType: "incomplete_source_limit",
          affectedSignal: e.poleKey,
          severity: e.skippedReason === "flag_off" ? "low" : "medium",
          explanation: `Source pole ${e.poleKey} omitted (${e.skippedReason ?? "unknown"}) — trust matrix and traces lack that bundle.`,
          userFacingWarning: "Incomplete industrial evidence compose — some upstream bundles missing.",
        });
      }
    }
    return dedupe(out).slice(0, 48);
  }
}

function dedupe(rows: IndustrialLimitationRecord[]): IndustrialLimitationRecord[] {
  const seen = new Set<string>();
  const out: IndustrialLimitationRecord[] = [];
  for (const r of rows) {
    const k = `${r.limitationType}:${r.affectedSignal}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}
