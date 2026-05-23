import type {
  IndustrialEvidenceRecord,
  IndustrialTrustLevel,
  IndustrialTrustMatrixEntry,
} from "@venext/shared-contracts";

import { Injectable } from "@nestjs/common";

export type IndustrialTrustAssessment = {
  trustLevel: IndustrialTrustLevel;
  trustReason: string;
  classificationPath: string[];
  derivedFromFlags: Record<string, boolean>;
};

@Injectable()
export class IndustrialTrustMatrixService {
  /**
   * Priority (18.8A): demo/synthetic and verified domain dominate; heuristic bands survive;
   * symbolic projection is a secondary overlay — it does not automatically collapse trust to SYMBOLIC_ONLY.
   */
  assessTrust(r: IndustrialEvidenceRecord): IndustrialTrustAssessment {
    const derivedFromFlags: Record<string, boolean> = {
      demoOrSynthetic: r.demoOrSynthetic,
      symbolicPresentation: r.symbolicProjection,
      heuristicLayer: r.heuristicOnly,
    };
    const path: string[] = [];

    if (r.demoOrSynthetic) {
      path.push("priority_demo_or_synthetic");
      return {
        trustLevel: "SYNTHETIC_DEMO_ONLY",
        trustReason: "Demo/synthetic provenance — exclude from operational or compliance-grade chains.",
        classificationPath: path,
        derivedFromFlags: { ...derivedFromFlags, demoDominant: true },
      };
    }

    if (r.evidenceType === "DOMAIN_EVENT") {
      path.push("priority_verified_domain_event");
      return {
        trustLevel: "VERIFIED_DOMAIN",
        trustReason: "Verified domain event row — highest trust bucket for this registry.",
        classificationPath: path,
        derivedFromFlags: { ...derivedFromFlags, verifiedDomain: true },
      };
    }

    if (r.evidenceType === "SYMBOLIC_PROJECTION") {
      path.push("intrinsic_symbolic_signal_type");
      return {
        trustLevel: "SYMBOLIC_ONLY",
        trustReason: "Intrinsic symbolic projection signal type — no claim of physical ground truth.",
        classificationPath: path,
        derivedFromFlags: { ...derivedFromFlags, symbolicPrimary: true },
      };
    }

    path.push("heuristic_classification");

    if (r.evidenceType === "SITUATION_ROOM_DERIVED" || r.evidenceType === "CONTINUITY_DERIVED") {
      path.push("cockpit_symbolic_presentation");
      const level: IndustrialTrustLevel = r.confidence >= 0.52 ? "STRONG_HEURISTIC" : "WEAK_HEURISTIC";
      return {
        trustLevel: level,
        trustReason:
          level === "STRONG_HEURISTIC"
            ? "Industrial cockpit digest — heuristic readout with symbolic presentation; symbolic layer does not downgrade heuristic bucket."
            : "Industrial cockpit digest — weaker heuristic readout; still not shop-floor telemetry.",
        classificationPath: r.symbolicProjection ? [...path, "symbolic_presentation_overlay"] : path,
        derivedFromFlags: { ...derivedFromFlags, cockpitHeuristic: true, symbolicOverlay: r.symbolicProjection },
      };
    }

    if (r.heuristicConfidence) {
      const level: IndustrialTrustLevel = r.confidence >= 0.55 ? "STRONG_HEURISTIC" : "WEAK_HEURISTIC";
      if (r.symbolicProjection) path.push("symbolic_presentation_overlay");
      return {
        trustLevel: level,
        trustReason:
          level === "STRONG_HEURISTIC"
            ? "Heuristic digest — stronger ordinal estimate from structural inputs; symbolic map may be present but does not override heuristic classification."
            : "Heuristic digest — weaker ordinal estimate; symbolic map may be present but does not override heuristic classification.",
        classificationPath: path,
        derivedFromFlags: { ...derivedFromFlags, heuristicPrimary: true, symbolicOverlay: r.symbolicProjection },
      };
    }

    path.push("confidence_basis_unknown");
    return {
      trustLevel: "UNKNOWN_SOURCE",
      trustReason: "Confidence basis not marked as heuristic estimate — treat as unknown trust posture.",
      classificationPath: path,
      derivedFromFlags: { ...derivedFromFlags, unknownBasis: true },
    };
  }

  /** Back-compat: trust level only (used when persisting record.trustLevel). */
  classifyRecord(r: IndustrialEvidenceRecord): IndustrialTrustLevel {
    return this.assessTrust(r).trustLevel;
  }

  buildMatrix(records: IndustrialEvidenceRecord[], organizationId: string): IndustrialTrustMatrixEntry[] {
    const byPole = new Map<string, IndustrialEvidenceRecord[]>();
    for (const r of records) {
      const k = r.sourcePole;
      if (!byPole.has(k)) byPole.set(k, []);
      byPole.get(k)!.push(r);
    }
    let i = 0;
    const out: IndustrialTrustMatrixEntry[] = [];
    for (const [scopeKey, list] of byPole) {
      i += 1;
      const assessments = list.map((x) => this.assessTrust(x));
      const levels = assessments.map((a) => a.trustLevel);
      const trust = this.mergeTrustLevels(levels);
      const worstRank = this.rankTrust(trust);
      const contributing = assessments.filter((a) => this.rankTrust(a.trustLevel) === worstRank);
      const trustReason =
        contributing
          .map((c) => c.trustReason)
          .filter((t, idx, arr) => arr.indexOf(t) === idx)
          .slice(0, 2)
          .join(" · ") || assessments[0]!.trustReason;
      const classificationPath = dedupeStrings(assessments.flatMap((a) => a.classificationPath)).slice(0, 24);
      const derivedFromFlags = mergeFlagMaps(assessments.map((a) => a.derivedFromFlags));
      out.push({
        matrixId: `tm-${organizationId.slice(0, 8)}-${i}`,
        scopeKey,
        trustLevel: trust,
        rationale: `Aggregated trust for ${list.length} evidence row(s) on ${scopeKey} — consultative registry, not legal attestation.`,
        evidenceIds: list.map((x) => x.evidenceId).slice(0, 48),
        trustReason,
        classificationPath,
        derivedFromFlags,
      });
    }
    return out.slice(0, 32);
  }

  private rankTrust(level: IndustrialTrustLevel): number {
    const rank: Record<IndustrialTrustLevel, number> = {
      SYNTHETIC_DEMO_ONLY: 0,
      UNKNOWN_SOURCE: 1,
      SYMBOLIC_ONLY: 2,
      WEAK_HEURISTIC: 3,
      STRONG_HEURISTIC: 4,
      VERIFIED_DOMAIN: 5,
    };
    return rank[level];
  }

  private mergeTrustLevels(levels: IndustrialTrustLevel[]): IndustrialTrustLevel {
    if (levels.length === 0) return "UNKNOWN_SOURCE";
    let worst = levels[0]!;
    for (const l of levels) {
      if (this.rankTrust(l) < this.rankTrust(worst)) worst = l;
    }
    return worst;
  }
}

function dedupeStrings(xs: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of xs) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function mergeFlagMaps(maps: Record<string, boolean>[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const m of maps) {
    for (const [k, v] of Object.entries(m)) {
      out[k] = Boolean(out[k]) || v;
    }
  }
  return out;
}
