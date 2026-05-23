"use client";

import { useMemo } from "react";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { EconomicCoordinationWorkspace } from "./EconomicCoordinationWorkspace";
import { resolveEconomicCoordinationOrganizationId } from "./resolveEconomicCoordinationOrganizationId";
import { useEconomicCoordinationData } from "./useEconomicCoordinationData";

const SLUG = "economic-coordination" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveEconomicCoordinationOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated && flags.industrial_poles_enabled !== false && flags.realtime_signals_enabled !== false && Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const coordinationData = useEconomicCoordinationData(org);
  const economicCoordinationCanvasHydration = useMemo(
    () => ({
      bundle: coordinationData.bundle,
      loading: coordinationData.loading,
      error: coordinationData.error,
    }),
    [coordinationData.bundle, coordinationData.loading, coordinationData.error],
  );

  return (
    <div className="flex min-h-0 flex-col">
      <EconomicCoordinationWorkspace
        realtimeGateway={realtimeGateway}
        organizationResolution={org}
        coordinationData={coordinationData}
      />
      <OperationalPoleCanvas
        poleSlug={SLUG}
        realtimeGateway={realtimeGateway}
        economicCoordinationOrganizationId={org.organizationId}
        economicCoordinationCanvasHydration={economicCoordinationCanvasHydration}
      />
    </div>
  );
}
