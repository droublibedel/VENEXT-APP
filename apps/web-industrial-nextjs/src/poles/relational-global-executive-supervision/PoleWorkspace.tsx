"use client";

import { useSearchParams } from "next/navigation";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { resolveRelationalOrdersOrganizationId } from "../relational-orders/resolveRelationalOrdersOrganizationId";

import { RelationalGlobalExecutiveSupervisionPanel } from "./RelationalGlobalExecutiveSupervisionPanel";

const SLUG = "relational-global-executive-supervision" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalOrdersOrganizationId();
  const params = useSearchParams();
  const relationshipId = params.get("relationshipId");
  const organizationId = params.get("organizationId") ?? org.organizationId;
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();

  const supervisionEnabled = hydrated && flags.relational_global_executive_supervision_enabled !== false;
  const realtimeEnabled = hydrated && flags.relational_global_executive_supervision_realtime_enabled !== false;

  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    supervisionEnabled &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled && realtimeEnabled,
    subscribeOrganizationId: organizationId ?? undefined,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  return (
    <div className="flex min-h-0 flex-col gap-3 px-3 py-3">
      <header className="rounded border border-violet-900/40 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-200/90">
          {entry?.title ?? "Supervision exécutive globale"}
        </p>
        <p className="mt-1 text-[10px] text-slate-400/70">{entry?.subtitle}</p>
      </header>
      <RelationalGlobalExecutiveSupervisionPanel
        organizationId={organizationId}
        relationshipId={relationshipId}
        supervisionEnabled={supervisionEnabled}
        realtimeGateway={gatewayEnabled && realtimeEnabled ? realtimeGateway : null}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
