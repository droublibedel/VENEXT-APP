import type { GpsCaptureResult, ReverseGeocodeResult } from "./commercial-location.types.js";
import { ABIDJAN_COMMERCIAL_CLUSTER } from "./ci-cities.js";

/** Reverse geocoding V1 — mock réaliste Côte d'Ivoire. */
export async function reverseGeocodeGps(gps: GpsCaptureResult): Promise<ReverseGeocodeResult> {
  const { latitude, longitude } = gps;
  if (latitude > 5 && latitude < 6 && longitude > -4.5 && longitude < -3.5) {
    const district = ABIDJAN_COMMERCIAL_CLUSTER[Math.floor(Math.abs(latitude * 100) % ABIDJAN_COMMERCIAL_CLUSTER.length)]!;
    return {
      city: "Abidjan",
      district,
      region: "Lagunes",
      country: "Côte d'Ivoire",
    };
  }
  if (latitude > 7 && latitude < 8) {
    return { city: "Bouaké", region: "Vallée du Bandama", country: "Côte d'Ivoire" };
  }
  return { city: "Abidjan", country: "Côte d'Ivoire" };
}
