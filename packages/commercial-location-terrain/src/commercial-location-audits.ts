import {
  getCommercialLocationProfile,
  hasExploitableLocation,
  toPublicLocationView,
} from "./commercial-location-storage.js";

export function auditCommercialLocationCoverage(actorIds: string[]) {
  const withLoc = actorIds.filter((id) => hasExploitableLocation(id));
  return {
    total: actorIds.length,
    covered: withLoc.length,
    rate: actorIds.length ? withLoc.length / actorIds.length : 0,
    gaps: actorIds.filter((id) => !hasExploitableLocation(id)),
  };
}

export function auditGpsPrecisionQuality(actorId: string) {
  const p = getCommercialLocationProfile(actorId);
  if (!p || p.sourceType !== "GPS") return { ok: false, reason: "no_gps_profile" };
  const ok = p.accuracyMeters != null && p.accuracyMeters <= 500;
  return { ok, accuracyMeters: p.accuracyMeters, hasCoordinates: p.latitude != null };
}

export function auditCommercialLocationPrivacy(actorId: string) {
  const pub = toPublicLocationView(getCommercialLocationProfile(actorId));
  const keys = Object.keys(pub);
  const leaks = keys.filter((k) => k === "latitude" || k === "longitude");
  return { ok: leaks.length === 0, publicKeys: keys };
}

export function auditLocationCompletionFlow(actorId: string) {
  const p = getCommercialLocationProfile(actorId);
  return {
    hasProfile: Boolean(p),
    sourceType: p?.sourceType,
    exploitable: hasExploitableLocation(actorId),
  };
}

export function auditMapReadiness(actorId: string) {
  const p = getCommercialLocationProfile(actorId);
  return {
    ready: Boolean(p?.city || (p?.latitude != null && p?.longitude != null)),
    hasGps: p?.sourceType === "GPS",
    hasCity: Boolean(p?.city),
  };
}
