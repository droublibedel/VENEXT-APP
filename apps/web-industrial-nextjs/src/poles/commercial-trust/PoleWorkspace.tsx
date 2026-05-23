"use client";

import { useSearchParams } from "next/navigation";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { CommercialTrustRealtimeStrip } from "./CommercialTrustRealtimeStrip";
import { CommercialTrustWorkspace } from "./CommercialTrustWorkspace";
import { resolveCommercialTrustOrganizationId } from "./resolveCommercialTrustOrganizationId";
import { useCommercialTrustData } from "./useCommercialTrustData";

const SLUG = "commercial-trust" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const searchParams = useSearchParams();
  const relationshipIdRaw =
    searchParams.get("relationshipId")?.trim() ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_COMMERCIAL_TRUST_RELATIONSHIP_ID?.trim()) ||
    "";
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const relationshipId = uuidRe.test(relationshipIdRaw) ? relationshipIdRaw : null;

  const org = resolveCommercialTrustOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.commercial_trust_layer_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const trustData = useCommercialTrustData(org.organizationId);

  return (
    <div className="flex min-h-0 flex-col">
      {flags.commercial_trust_realtime_enabled !== false ? (
        <CommercialTrustRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par <span className="font-mono">commercial_trust_realtime_enabled</span>.
        </p>
      )}
      <CommercialTrustWorkspace
        data={trustData.data}
        loading={trustData.loading}
        error={trustData.error}
        relationshipId={relationshipId}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
