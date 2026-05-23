import { INDUSTRIAL_SITUATION_ROOM_DEMO_ORGANIZATION_ID } from "./constants";

export type IndustrialSituationRoomOrgResolution = {
  organizationId: string;
  source: "explicit_env" | "demo_fallback";
};

export function resolveIndustrialSituationRoomOrganizationId(): IndustrialSituationRoomOrgResolution {
  const fromEnv =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_INDUSTRIAL_SITUATION_ROOM_ORGANIZATION_ID?.trim()) || "";
  if (fromEnv) {
    return { organizationId: fromEnv, source: "explicit_env" };
  }
  return { organizationId: INDUSTRIAL_SITUATION_ROOM_DEMO_ORGANIZATION_ID, source: "demo_fallback" };
}
