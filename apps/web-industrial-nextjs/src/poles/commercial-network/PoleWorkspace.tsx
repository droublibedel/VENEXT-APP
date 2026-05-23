"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { CommercialNetworkWorkspace } from "./CommercialNetworkWorkspace";
import { RelationshipFieldRibbon } from "./widgets/RelationshipFieldRibbon";

const SLUG = "commercial-network" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated && flags.industrial_poles_enabled !== false && flags.realtime_signals_enabled !== false && Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
  });

  return (
    <div className="flex min-h-0 flex-col">
      <RelationshipFieldRibbon />
      <CommercialNetworkWorkspace realtimeGateway={realtimeGateway} />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
