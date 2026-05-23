"use client";

import { useMemo } from "react";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { IndustrialOperationalContinuityRealtimeStrip } from "./IndustrialOperationalContinuityRealtimeStrip";
import { IndustrialOperationalContinuityWorkspace } from "./IndustrialOperationalContinuityWorkspace";
import { resolveIndustrialOperationalContinuityOrganizationId } from "./resolveIndustrialOperationalContinuityOrganizationId";
import { useIndustrialOperationalContinuityData } from "./useIndustrialOperationalContinuityData";

const SLUG = "industrial-operational-continuity" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveIndustrialOperationalContinuityOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.industrial_operational_continuity_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const continuityData = useIndustrialOperationalContinuityData(org);
  const industrialOperationalContinuityCanvasHydration = useMemo(
    () => ({
      bundle: continuityData.bundle,
      loading: continuityData.loading,
      error: continuityData.error,
    }),
    [continuityData.bundle, continuityData.loading, continuityData.error],
  );

  return (
    <div className="flex min-h-0 flex-col">
      {flags.industrial_operational_continuity_realtime_enabled !== false ? (
        <IndustrialOperationalContinuityRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par{" "}
          <span className="font-mono">industrial_operational_continuity_realtime_enabled</span>.
        </p>
      )}
      <IndustrialOperationalContinuityWorkspace
        bundle={continuityData.bundle}
        loading={continuityData.loading}
        error={continuityData.error}
      />
      <OperationalPoleCanvas
        poleSlug={SLUG}
        realtimeGateway={realtimeGateway}
        industrialOperationalContinuityOrganizationId={org.organizationId}
        industrialOperationalContinuityCanvasHydration={industrialOperationalContinuityCanvasHydration}
      />
    </div>
  );
}
