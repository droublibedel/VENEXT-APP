"use client";

import { useSearchParams } from "next/navigation";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { resolveRelationalOrdersOrganizationId } from "../relational-orders/resolveRelationalOrdersOrganizationId";

import { RelationalSupplyFlowPanel } from "./RelationalSupplyFlowPanel";

const SLUG = "relational-supply-flow" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalOrdersOrganizationId();
  const params = useSearchParams();
  const relationshipId = params.get("relationshipId");
  const organizationId = params.get("organizationId") ?? org.organizationId;
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();

  const supplyEnabled = hydrated && flags.relational_supply_flow_enabled !== false;
  const realtimeEnabled = hydrated && flags.relational_supply_flow_realtime_enabled !== false;

  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    supplyEnabled &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled && realtimeEnabled,
    subscribeOrganizationId: organizationId ?? undefined,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  return (
    <div className="flex min-h-0 flex-col gap-3 px-3 py-3">
      <header className="rounded border border-orange-800/50 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-orange-200/90">
          {entry?.title ?? "Supply flow intelligence"}
        </p>
        <p className="mt-1 text-[10px] text-orange-100/60">{entry?.subtitle}</p>
      </header>
      <RelationalSupplyFlowPanel
        organizationId={organizationId}
        relationshipId={relationshipId}
        supplyFlowEnabled={supplyEnabled}
        realtimeEnabled={realtimeEnabled}
        realtimeGateway={gatewayEnabled && realtimeEnabled ? realtimeGateway : null}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
