import {
  getCommercialLocationProfile,
  hasExploitableLocation,
  saveCommercialLocationProfile,
  toPublicLocationView,
} from "commercial-location-terrain";
import type { CommercialLocationProfile } from "commercial-location-terrain";
import { inferLocationFromPhone, patchCommercialLocation, saveGpsLocation, saveManualCity } from "commercial-location-terrain";

export function bffGetCommercialLocation(actorId: string): CommercialLocationProfile | null {
  return getCommercialLocationProfile(actorId);
}

export function bffGetCommercialLocationPublic(actorId: string) {
  return toPublicLocationView(getCommercialLocationProfile(actorId));
}

export async function bffPostCommercialLocation(body: {
  actorId: string;
  city?: string;
  district?: string;
  sourceType?: CommercialLocationProfile["sourceType"];
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  phone?: string;
  useGps?: boolean;
}): Promise<CommercialLocationProfile> {
  const actorId = String(body.actorId);
  if (body.useGps) {
    const { profile, denied } = await saveGpsLocation(actorId);
    if (profile) return profile;
    if (denied && body.city) return saveManualCity(actorId, body.city, body.district);
    if (denied && body.phone) return inferLocationFromPhone(body.phone, actorId);
    throw new Error("gps_denied");
  }
  if (body.city) return saveManualCity(actorId, body.city, body.district);
  if (body.latitude != null && body.longitude != null) {
    return saveCommercialLocationProfile({
      actorId,
      city: body.city,
      district: body.district,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracyMeters: body.accuracyMeters,
      sourceType: "GPS",
      gpsValidatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  if (body.phone) return inferLocationFromPhone(body.phone, actorId);
  throw new Error("invalid_location_payload");
}

export function bffPatchCommercialLocation(
  actorId: string,
  patch: Partial<Pick<CommercialLocationProfile, "city" | "district" | "region">>,
): CommercialLocationProfile | null {
  return patchCommercialLocation(actorId, patch);
}

export { hasExploitableLocation };
