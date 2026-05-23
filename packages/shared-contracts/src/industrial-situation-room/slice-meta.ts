/** Instruction 18.6 — slice routes mirror full situation-room compose (upstream economic command pipeline). */
export function buildIndustrialSituationRoomSliceDiagnostics(composeCacheHit: boolean) {
  return {
    sliceSource: "FULL_BUNDLE_SLICE" as const,
    serverCost: "FULL_COMPOSE" as const,
    independentCompute: false as const,
    recommendedClientMode: "BUNDLE_FIRST" as const,
    cacheStrategy: "SHORT_TTL_SITUATION_ROOM_CACHE" as const,
    composeCacheHit,
  };
}

export type IndustrialSituationRoomSliceDiagnostics = ReturnType<typeof buildIndustrialSituationRoomSliceDiagnostics>;
