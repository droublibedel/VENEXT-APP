"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchIndustrialEvidenceBundleJson } from "./industrial-evidence-api";

type EvidenceBundle = {
  policy?: string;
  disclaimer?: string;
  snapshot?: {
    headline?: string;
    records?: unknown[];
    trustMatrix?: unknown[];
    traces?: unknown[];
    limitations?: unknown[];
    sourceMap?: unknown[];
    diagnostics?: Record<string, unknown>;
    evidenceScope?: Record<string, string>;
    interpretationBoundary?: string;
    reliabilityBoundary?: string;
  };
};

/**
 * Instruction 18.8A — bundle-first: single GET /bundle; no parallel slice calls when bundle succeeds.
 */
export function useIndustrialEvidenceData(organizationId: string) {
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degradedBundleMode, setDegradedBundleMode] = useState(false);
  const [fallbackSource, setFallbackSource] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFallbackSource(null);
    setFallbackReason(null);
    const b = await fetchIndustrialEvidenceBundleJson<EvidenceBundle>(organizationId, "summary");
    if (!b) {
      setError("Le registre de preuve n’est pas disponible pour le moment.");
      setBundle(null);
      setDegradedBundleMode(true);
      setFallbackReason("bundle_endpoint_unavailable");
      setLoading(false);
      return;
    }
    setBundle(b);
    const diag = b.snapshot?.diagnostics ?? {};
    const degraded = Boolean(diag.degradedBundleMode ?? diag.degradedMode);
    setDegradedBundleMode(degraded);
    if (!b.snapshot?.records || !Array.isArray(b.snapshot.records)) {
      setDegradedBundleMode(true);
      setFallbackSource("bundle_snapshot_incomplete");
      setFallbackReason("missing_records_slice_fallback_not_implemented");
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bundle, loading, error, degradedBundleMode, fallbackSource, fallbackReason, reload: load };
}
