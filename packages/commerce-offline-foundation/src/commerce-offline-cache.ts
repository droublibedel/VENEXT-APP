import type {
  CommerceOfflineCacheDomain,
  CommerceOfflineCacheEntry,
} from "./commerce-offline.types";
import { COMMERCE_OFFLINE_TTL_DAYS } from "./commerce-offline.types";
import { readCacheStore, writeCacheStore } from "./commerce-offline-storage";

export function cacheKeyFor(domain: CommerceOfflineCacheDomain, organizationId: string): string {
  return `${organizationId}:${domain}`;
}

export function expiresAtForDomain(domain: CommerceOfflineCacheDomain, from = Date.now()): string {
  const days = COMMERCE_OFFLINE_TTL_DAYS[domain];
  return new Date(from + days * 86_400_000).toISOString();
}

export function isCacheEntryExpired(entry: CommerceOfflineCacheEntry, now = Date.now()): boolean {
  return new Date(entry.expiresAt).getTime() <= now;
}

export function readOfflineCache<T>(
  organizationId: string,
  domain: CommerceOfflineCacheDomain,
): T | null {
  const key = cacheKeyFor(domain, organizationId);
  const entry = readCacheStore(organizationId).find((e) => e.key === key);
  if (!entry || isCacheEntryExpired(entry)) return null;
  return entry.payload as T;
}

export function writeOfflineCache<T>(
  organizationId: string,
  domain: CommerceOfflineCacheDomain,
  payload: T,
): CommerceOfflineCacheEntry<T> {
  const key = cacheKeyFor(domain, organizationId);
  const now = Date.now();
  const entry: CommerceOfflineCacheEntry<T> = {
    key,
    domain,
    organizationId,
    payload,
    cachedAt: new Date(now).toISOString(),
    expiresAt: expiresAtForDomain(domain, now),
  };
  const store = readCacheStore(organizationId).filter((e) => e.key !== key);
  store.push(entry);
  writeCacheStore(organizationId, store);
  return entry;
}

export function purgeExpiredCache(organizationId: string): number {
  const store = readCacheStore(organizationId);
  const kept = store.filter((e) => !isCacheEntryExpired(e));
  writeCacheStore(organizationId, kept);
  return store.length - kept.length;
}

export function clearOfflineCache(organizationId: string): void {
  writeCacheStore(organizationId, []);
}
