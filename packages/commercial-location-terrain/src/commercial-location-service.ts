import type { CommercialLocationProfile } from "./commercial-location.types.js";
import {
  getCommercialLocationProfile,
  saveCommercialLocationProfile,
} from "./commercial-location-storage.js";
import { captureGpsPosition } from "./gps-capture.js";
import { reverseGeocodeGps } from "./reverse-geocoding.js";
import { reportCommercialLocationEvent } from "./location-observability.js";

export async function saveManualCity(actorId: string, city: string, district?: string): Promise<CommercialLocationProfile> {
  const profile = saveCommercialLocationProfile({
    actorId,
    city: city.trim(),
    district: district?.trim(),
    sourceType: "MANUAL_CITY",
    updatedAt: new Date().toISOString(),
  });
  reportCommercialLocationEvent("city_completed");
  reportCommercialLocationEvent("commercial_location_completed");
  return profile;
}

export async function saveGpsLocation(actorId: string): Promise<{
  profile?: CommercialLocationProfile;
  denied: boolean;
}> {
  const { outcome, gps } = await captureGpsPosition();
  if (outcome !== "granted" || !gps) {
    reportCommercialLocationEvent("gps_permission_denied");
    return { denied: true };
  }
  reportCommercialLocationEvent("gps_permission_granted");
  const geo = await reverseGeocodeGps(gps);
  const profile = saveCommercialLocationProfile({
    actorId,
    city: geo.city,
    district: geo.district,
    region: geo.region,
    country: geo.country,
    latitude: gps.latitude,
    longitude: gps.longitude,
    accuracyMeters: gps.accuracyMeters,
    sourceType: "GPS",
    gpsValidatedAt: gps.timestamp,
    updatedAt: new Date().toISOString(),
  });
  reportCommercialLocationEvent("commercial_location_completed");
  return { profile, denied: false };
}

export function patchCommercialLocation(
  actorId: string,
  patch: Partial<Pick<CommercialLocationProfile, "city" | "district" | "region">>,
): CommercialLocationProfile | null {
  const existing = getCommercialLocationProfile(actorId);
  if (!existing) return null;
  return saveCommercialLocationProfile({
    ...existing,
    ...patch,
    sourceType: patch.city ? "MANUAL_CITY" : existing.sourceType,
    updatedAt: new Date().toISOString(),
  });
}
