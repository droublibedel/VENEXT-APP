import type {
  IndustrialEvidenceRecord,
  IndustrialEvidenceTrace,
  IndustrialEvidenceTraceNode,
} from "@venext/shared-contracts";

import { Injectable } from "@nestjs/common";

@Injectable()
export class IndustrialEvidenceTraceService {
  buildTraces(
    records: IndustrialEvidenceRecord[],
    organizationId: string,
    traceEnabled: boolean,
  ): IndustrialEvidenceTrace[] {
    if (!traceEnabled) return [];
    const byPole = new Map(records.map((r) => [r.sourcePole, r] as const));
    const cmd = byPole.get("ECONOMIC_COMMAND");
    const prop = byPole.get("ECONOMIC_PROPAGATION");
    const isr = byPole.get("INDUSTRIAL_SITUATION_ROOM");
    if (!cmd || !prop) return [];

    const nodes: IndustrialEvidenceTraceNode[] = [];
    let depth = 0;
    if (prop) {
      depth += 1;
      nodes.push({
        nodeId: `n-${organizationId.slice(0, 6)}-prop`,
        label: "Propagation readout — co-occurrence with command digest (same compose window)",
        pole: "ECONOMIC_PROPAGATION",
        evidenceType: "PROPAGATION_DERIVED",
        derivedFrom: ["EconomicPropagationEngineService.compose"],
        confidence: prop.confidence,
      });
    }
    if (cmd) {
      depth += 1;
      nodes.push({
        nodeId: `n-${organizationId.slice(0, 6)}-cmd`,
        label: "Economic command digest — alignment readout (shared pressure lens)",
        pole: "ECONOMIC_COMMAND",
        evidenceType: "COMMAND_DERIVED",
        derivedFrom: ["EconomicCommandEngineService.getBundleWithCacheMeta"],
        confidence: cmd.confidence,
      });
    }
    if (isr) {
      depth += 1;
      nodes.push({
        nodeId: `n-${organizationId.slice(0, 6)}-isr`,
        label: "Industrial situation room — correlation with same advisory compose (not sequencing)",
        pole: "INDUSTRIAL_SITUATION_ROOM",
        evidenceType: "SITUATION_ROOM_DERIVED",
        derivedFrom: ["IndustrialSituationRoomEngineService.getBundleWithCacheMeta"],
        confidence: isr.confidence,
      });
    }
    const decay = Number(Math.max(0.15, Math.min(1, nodes.reduce((m, n) => Math.min(m, n.confidence), 1))).toFixed(4));
    const trace: IndustrialEvidenceTrace = {
      traceId: `trace-${organizationId.slice(0, 8)}-derived-1`,
      rootSignal: "cross_pole_pressure_digest",
      traceDepth: depth,
      traceKind: "DERIVED_TRACE_NOT_CAUSAL_PROOF",
      nodes,
      confidenceDecay: Number(decay),
      weakestLink: nodes.length ? nodes.reduce((a, b) => (a.confidence <= b.confidence ? a : b)).nodeId : "none",
      explanation:
        "Non-causal correlation view: same-registry alignment across bundles (co-occurrence / shared advisory pressure). Descriptive co-location only — not sequencing, not legal attestation, not scheduling advice, not production causality.",
      nonCausalTrace: true,
      interpretationRisk:
        "Readers may mistakenly infer sequencing or production causality from ordered nodes — order is presentation-only.",
      explanatoryBoundary:
        "Boundary: correlation / alignment / shared-pressure framing only; excludes causal verbs, legal proof, and operational dispatch claims.",
    };
    return [trace];
  }
}
