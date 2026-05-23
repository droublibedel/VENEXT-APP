import type { OperationalSignalItem } from "../types";

import { ECONOMIC_COMMAND_REALTIME_CLASS_LABELS } from "../economic-command/economic-command-realtime-classification";

export type IndustrialSituationRoomRealtimeClass = "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";

export function classifyIndustrialSituationRoomStreamItem(it: OperationalSignalItem): IndustrialSituationRoomRealtimeClass | null {
  if (it.industrialSituationRoomRealtimeClass) return it.industrialSituationRoomRealtimeClass;
  if (it.pole !== "INDUSTRIAL_SITUATION_ROOM") return null;
  const env = it.industrialSituationRoomEnvelope ?? "";
  if (env.startsWith("live.industrial_situation_room.")) return "DOMAIN_LIVE";
  if (env.startsWith("demo.industrial_situation_room.")) return "DEMO_MIRROR";
  return "SYNTHETIC_TICK";
}

export const INDUSTRIAL_SITUATION_ROOM_REALTIME_CLASS_LABELS = ECONOMIC_COMMAND_REALTIME_CLASS_LABELS;
