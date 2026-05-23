const seen = new Map<string, number>();
const TTL_MS = 60_000;
const MAX_KEYS = 500;

export function liveEventFingerprint(parts: string[]): string {
  return parts.filter(Boolean).join("|").slice(0, 240);
}

export function shouldDedupeLiveEvent(fingerprint: string, windowMs = TTL_MS): boolean {
  const now = Date.now();
  const prev = seen.get(fingerprint);
  seen.set(fingerprint, now);
  if (seen.size > MAX_KEYS) {
    for (const [k, t] of seen) {
      if (now - t > windowMs) seen.delete(k);
    }
  }
  return prev != null && now - prev < windowMs;
}

export function resetLiveDedupeForTests(): void {
  seen.clear();
}
