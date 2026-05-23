"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { FINANCE_COLLECTIONS_DEMO_ORGANIZATION_ID } from "./constants";
import { FinanceCollectionsWorkspace } from "./FinanceCollectionsWorkspace";

const SLUG = "finance-collections" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated && flags.industrial_poles_enabled !== false && flags.realtime_signals_enabled !== false && Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: FINANCE_COLLECTIONS_DEMO_ORGANIZATION_ID,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  return (
    <div className="flex min-h-0 flex-col">
      <FinanceCollectionsWorkspace realtimeGateway={realtimeGateway} />
      <OperationalPoleCanvas
        poleSlug={SLUG}
        realtimeGateway={realtimeGateway}
        financeCollectionsOrganizationId={FINANCE_COLLECTIONS_DEMO_ORGANIZATION_ID}
      />
    </div>
  );
}
