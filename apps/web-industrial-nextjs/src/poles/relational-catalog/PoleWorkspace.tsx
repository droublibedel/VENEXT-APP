"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { RelationalCatalogRealtimeStrip } from "./RelationalCatalogRealtimeStrip";
import { RelationalCatalogWorkspace } from "./RelationalCatalogWorkspace";
import { resolveRelationalCatalogOrganizationId } from "./resolveRelationalCatalogOrganizationId";
import { useRelationalCatalogData } from "./useRelationalCatalogData";

const SLUG = "relational-catalog" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalCatalogOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.relational_catalog_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const catalogData = useRelationalCatalogData(org.organizationId);

  return (
    <div className="flex min-h-0 flex-col">
      {flags.relational_catalog_realtime_enabled !== false ? (
        <RelationalCatalogRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par <span className="font-mono">relational_catalog_realtime_enabled</span>.
        </p>
      )}
      <RelationalCatalogWorkspace
        data={catalogData.data}
        loading={catalogData.loading}
        error={catalogData.error}
        viewerOrganizationId={org.organizationId}
        directCatalogEnabled={
          hydrated &&
          flags.industrial_poles_enabled !== false &&
          flags.relational_catalog_enabled !== false &&
          flags.relational_cart_direct_catalog_enabled !== false
        }
        actingUserId={process.env.NEXT_PUBLIC_RELATIONAL_CART_USER_ID}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
