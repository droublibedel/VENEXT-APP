"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { RelationalOrdersRealtimeStrip } from "./RelationalOrdersRealtimeStrip";
import { RelationalOrdersWorkspace } from "./RelationalOrdersWorkspace";
import { resolveRelationalOrdersOrganizationId } from "./resolveRelationalOrdersOrganizationId";
import { useRelationalOrdersData } from "./useRelationalOrdersData";

const SLUG = "relational-orders" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalOrdersOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.relational_orders_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const ordersData = useRelationalOrdersData(org.organizationId);

  return (
    <div className="flex min-h-0 flex-col">
      {flags.relational_orders_realtime_enabled !== false ? (
        <RelationalOrdersRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par <span className="font-mono">relational_orders_realtime_enabled</span>.
        </p>
      )}
      <RelationalOrdersWorkspace
        data={ordersData.data}
        loading={ordersData.loading}
        error={ordersData.error}
        loadNextPage={ordersData.loadNextPage}
        loadingMore={ordersData.loadingMore}
        appliedStatus={ordersData.appliedStatus}
        appliedRelationshipId={ordersData.appliedRelationshipId}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
