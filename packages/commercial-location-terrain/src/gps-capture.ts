import type { GpsCaptureResult } from "./commercial-location.types.js";

export type GpsPermissionOutcome = "granted" | "denied" | "unavailable";

export async function captureGpsPosition(): Promise<{ outcome: GpsPermissionOutcome; gps?: GpsCaptureResult }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { outcome: "unavailable" };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          outcome: "granted",
          gps: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
            timestamp: new Date(pos.timestamp).toISOString(),
          },
        });
      },
      () => resolve({ outcome: "denied" }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  });
}
