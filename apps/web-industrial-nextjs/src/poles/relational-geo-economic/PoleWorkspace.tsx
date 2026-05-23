"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { resolveRelationalOrdersOrganizationId } from "../relational-orders/resolveRelationalOrdersOrganizationId";

import { RelationalGeoEconomicPanel } from "./RelationalGeoEconomicPanel";

const SLUG = "relational-geo-economic" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalOrdersOrganizationId();
  const params = useSearchParams();
  const relationshipId = params.get("relationshipId");
  const organizationId = params.get("organizationId") ?? org.organizationId;
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();

  const geoEnabled = hydrated && flags.relational_geo_economic_enabled !== false;
  const realtimeEnabled = hydrated && flags.relational_geo_economic_realtime_enabled !== false;

  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    geoEnabled &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled && realtimeEnabled,
    subscribeOrganizationId: organizationId ?? undefined,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const lastRealtimeLabel = useMemo(() => {
    const hit = realtimeGateway.stream.find(
      (s) => s.detail.includes("relational.geo") || s.label.includes("relational.geo"),
    );
    return hit?.label ?? null;
  }, [realtimeGateway.stream]);

  return (
    <div className="flex min-h-0 flex-col gap-3 px-3 py-3">
      <header className="rounded border border-amber-800/50 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
          {entry?.title ?? "Intelligence géo-économique"}
        </p>
        <p className="mt-1 text-[10px] text-amber-100/60">{entry?.subtitle}</p>
      </header>
      <RelationalGeoEconomicPanel
        organizationId={organizationId}
        relationshipId={relationshipId}
        geoEnabled={geoEnabled}
        realtimeEnabled={realtimeEnabled}
        lastRealtimeLabel={lastRealtimeLabel}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
