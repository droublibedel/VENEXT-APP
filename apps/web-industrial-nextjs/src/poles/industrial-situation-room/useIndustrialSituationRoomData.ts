"use client";

import { useEffect, useState } from "react";
import type { IndustrialSituationRoomBundle } from "@venext/shared-contracts";

import { fetchIndustrialSituationRoomBundleJson } from "./industrial-situation-room-api";
import type { IndustrialSituationRoomOrgResolution } from "./resolveIndustrialSituationRoomOrganizationId";

export type IndustrialSituationRoomRemoteData = {
  bundle: IndustrialSituationRoomBundle | null;
  loading: boolean;
  error: string | null;
};

export function useIndustrialSituationRoomData(resolution: IndustrialSituationRoomOrgResolution): IndustrialSituationRoomRemoteData {
  const [bundle, setBundle] = useState<IndustrialSituationRoomBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchIndustrialSituationRoomBundleJson<IndustrialSituationRoomBundle>(resolution.organizationId).then((b) => {
      if (cancelled) return;
      if (!b || b.version !== "1") {
        setBundle(null);
        setError("bundle_unavailable");
      } else {
        setBundle(b);
        setError(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [resolution.organizationId]);

  return { bundle, loading, error };
}
