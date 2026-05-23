"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { SUPPLY_LOGISTICS_DEMO_ORGANIZATION_ID } from "./constants";
import { ConvoyRibbon } from "./widgets/ConvoyRibbon";
import { SupplyLogisticsWorkspace } from "./SupplyLogisticsWorkspace";

const SLUG = "supply-logistics" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated && flags.industrial_poles_enabled !== false && flags.realtime_signals_enabled !== false && Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: SUPPLY_LOGISTICS_DEMO_ORGANIZATION_ID,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  return (
    <div className="flex min-h-0 flex-col">
      <ConvoyRibbon />
      <SupplyLogisticsWorkspace realtimeGateway={realtimeGateway} />
      <OperationalPoleCanvas
        poleSlug={SLUG}
        realtimeGateway={realtimeGateway}
        supplyLogisticsOrganizationId={SUPPLY_LOGISTICS_DEMO_ORGANIZATION_ID}
      />
    </div>
  );
}
