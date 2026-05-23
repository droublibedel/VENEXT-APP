import type { CommercialLocationProfile, CommercialLocationPublicView } from "./commercial-location.types.js";

const profiles = new Map<string, CommercialLocationProfile>();
const dismissedPrompts = new Set<string>();

export function getCommercialLocationProfile(actorId: string): CommercialLocationProfile | null {
  return profiles.get(actorId) ?? null;
}

export function hasExploitableLocation(actorId: string): boolean {
  const p = profiles.get(actorId);
  if (!p) return false;
  return Boolean(p.city || (p.latitude != null && p.longitude != null));
}

export function saveCommercialLocationProfile(profile: CommercialLocationProfile): CommercialLocationProfile {
  const row: CommercialLocationProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  profiles.set(profile.actorId, row);
  return row;
}

export function toPublicLocationView(profile: CommercialLocationProfile | null): CommercialLocationPublicView {
  if (!profile) return {};
  return {
    city: profile.city,
    district: profile.district,
    region: profile.region ?? profile.city,
    proximityLabel: profile.district ? `${profile.district}, ${profile.city}` : profile.city,
  };
}

export function markSoftLocationPromptDismissed(actorId: string, sessionKey: string): void {
  dismissedPrompts.add(`${actorId}:${sessionKey}`);
}

export function wasSoftLocationPromptDismissed(actorId: string, sessionKey: string): boolean {
  return dismissedPrompts.has(`${actorId}:${sessionKey}`);
}

export function resetCommercialLocationStorageForTests(): void {
  profiles.clear();
  dismissedPrompts.clear();
}
