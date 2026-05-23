"use client";

import { useMemo } from "react";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { IndustrialSituationRoomRealtimeStrip } from "./IndustrialSituationRoomRealtimeStrip";
import { IndustrialSituationRoomWorkspace } from "./IndustrialSituationRoomWorkspace";
import { resolveIndustrialSituationRoomOrganizationId } from "./resolveIndustrialSituationRoomOrganizationId";
import { useIndustrialSituationRoomData } from "./useIndustrialSituationRoomData";

const SLUG = "industrial-situation-room" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveIndustrialSituationRoomOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.industrial_situation_room_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const situationData = useIndustrialSituationRoomData(org);
  const industrialSituationRoomCanvasHydration = useMemo(
    () => ({
      bundle: situationData.bundle,
      loading: situationData.loading,
      error: situationData.error,
    }),
    [situationData.bundle, situationData.loading, situationData.error],
  );

  return (
    <div className="flex min-h-0 flex-col">
      {flags.industrial_situation_room_realtime_enabled !== false ? (
        <IndustrialSituationRoomRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par <span className="font-mono">industrial_situation_room_realtime_enabled</span>.
        </p>
      )}
      <IndustrialSituationRoomWorkspace bundle={situationData.bundle} loading={situationData.loading} error={situationData.error} />
      <OperationalPoleCanvas
        poleSlug={SLUG}
        realtimeGateway={realtimeGateway}
        industrialSituationRoomOrganizationId={org.organizationId}
        industrialSituationRoomCanvasHydration={industrialSituationRoomCanvasHydration}
      />
    </div>
  );
}
