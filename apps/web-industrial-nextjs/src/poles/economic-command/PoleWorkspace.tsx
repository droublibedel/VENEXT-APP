"use client";

import { useMemo } from "react";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { EconomicCommandWorkspace } from "./EconomicCommandWorkspace";
import { resolveEconomicCommandOrganizationId } from "./resolveEconomicCommandOrganizationId";
import { useEconomicCommandData } from "./useEconomicCommandData";

const SLUG = "economic-command" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveEconomicCommandOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.economic_command_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const commandData = useEconomicCommandData(org);
  const economicCommandCanvasHydration = useMemo(
    () => ({
      bundle: commandData.bundle,
      loading: commandData.loading,
      error: commandData.error,
    }),
    [commandData.bundle, commandData.loading, commandData.error],
  );

  return (
    <div className="flex min-h-0 flex-col">
      <EconomicCommandWorkspace
        realtimeGateway={realtimeGateway}
        organizationResolution={org}
        commandData={commandData}
      />
      <OperationalPoleCanvas
        poleSlug={SLUG}
        realtimeGateway={realtimeGateway}
        economicCommandOrganizationId={org.organizationId}
        economicCommandCanvasHydration={economicCommandCanvasHydration}
      />
    </div>
  );
}
