"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { RelationalOrderExecutionRealtimeStrip } from "./surfaces/RelationalOrderExecutionRealtimeStrip";
import { RelationalOrderExecutionWorkspace } from "./RelationalOrderExecutionWorkspace";
import { useRelationalOrderExecutionData, useRelationalOrderExecutionRouteIds } from "./useRelationalOrderExecutionData";
import { resolveRelationalOrdersOrganizationId } from "../relational-orders/resolveRelationalOrdersOrganizationId";

const SLUG = "relational-order-execution" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalOrdersOrganizationId();
  const route = useRelationalOrderExecutionRouteIds();
  const organizationId = route.organizationId ?? org.organizationId;
  const { orderId } = route;
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.relational_order_execution_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const execData = useRelationalOrderExecutionData(organizationId, orderId);

  return (
    <div className="flex min-h-0 flex-col">
      {flags.relational_orders_realtime_enabled !== false ? (
        <RelationalOrderExecutionRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par <span className="font-mono">relational_orders_realtime_enabled</span>.
        </p>
      )}
      <RelationalOrderExecutionWorkspace
        data={execData.data}
        loading={execData.loading}
        error={execData.error}
        orderId={orderId}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
