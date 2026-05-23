"use client";

import { useSearchParams } from "next/navigation";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { CorridorRealtimeStrip } from "./CorridorRealtimeStrip";
import { CorridorWorkspace } from "./CorridorWorkspace";
import { resolveCorridorIntelligenceOrganizationId } from "./resolveCorridorIntelligenceOrganizationId";
import { useCorridorIntelligenceData } from "./useCorridorIntelligenceData";

const SLUG = "corridor-intelligence" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const searchParams = useSearchParams();
  const relationshipIdRaw =
    searchParams.get("relationshipId")?.trim() ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CORRIDOR_INTELLIGENCE_RELATIONSHIP_ID?.trim()) ||
    "";
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const relationshipId = uuidRe.test(relationshipIdRaw) ? relationshipIdRaw : null;

  const org = resolveCorridorIntelligenceOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.corridor_intelligence_layer_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const corridorData = useCorridorIntelligenceData(relationshipId);

  return (
    <div className="flex min-h-0 flex-col">
      {flags.corridor_intelligence_realtime_enabled !== false ? (
        <CorridorRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par <span className="font-mono">corridor_intelligence_realtime_enabled</span>.
        </p>
      )}
      <CorridorWorkspace data={corridorData.data} loading={corridorData.loading} error={corridorData.error} />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
