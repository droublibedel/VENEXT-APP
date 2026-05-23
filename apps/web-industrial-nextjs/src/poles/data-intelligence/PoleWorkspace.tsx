"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { DataIntelligenceWorkspace } from "./DataIntelligenceWorkspace";
import { resolveDataIntelligenceOrganizationId } from "./resolveDataIntelligenceOrganizationId";

const SLUG = "data-intelligence" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveDataIntelligenceOrganizationId();
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

  return (
    <div className="flex min-h-0 flex-col">
      <DataIntelligenceWorkspace realtimeGateway={realtimeGateway} organizationResolution={org} />
      <OperationalPoleCanvas
        poleSlug={SLUG}
        realtimeGateway={realtimeGateway}
        dataIntelligenceOrganizationId={org.organizationId}
      />
    </div>
  );
}
