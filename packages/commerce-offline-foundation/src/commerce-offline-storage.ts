import type {
  CommerceOfflineCacheEntry,
  CommerceOfflineQueueItem,
  CommerceOfflineSyncState,
} from "./commerce-offline.types";
import {
  COMMERCE_OFFLINE_CACHE_NS,
  COMMERCE_OFFLINE_QUEUE_NS,
  COMMERCE_OFFLINE_SYNC_NS,
} from "./commerce-offline.types";

function storageKey(ns: string, organizationId: string): string {
  return `${ns}:${organizationId}`;
}

export function readJson<T>(key: string): T | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function readCacheStore(organizationId: string): CommerceOfflineCacheEntry[] {
  return readJson<CommerceOfflineCacheEntry[]>(storageKey(COMMERCE_OFFLINE_CACHE_NS, organizationId)) ?? [];
}

export function writeCacheStore(organizationId: string, entries: CommerceOfflineCacheEntry[]): void {
  writeJson(storageKey(COMMERCE_OFFLINE_CACHE_NS, organizationId), entries);
}

export function readQueueStore(organizationId: string): CommerceOfflineQueueItem[] {
  return readJson<CommerceOfflineQueueItem[]>(storageKey(COMMERCE_OFFLINE_QUEUE_NS, organizationId)) ?? [];
}

export function writeQueueStore(organizationId: string, items: CommerceOfflineQueueItem[]): void {
  writeJson(storageKey(COMMERCE_OFFLINE_QUEUE_NS, organizationId), items);
}

export function readSyncState(organizationId: string): CommerceOfflineSyncState | null {
  return readJson<CommerceOfflineSyncState>(storageKey(COMMERCE_OFFLINE_SYNC_NS, organizationId));
}

export function writeSyncState(organizationId: string, state: CommerceOfflineSyncState): void {
  writeJson(storageKey(COMMERCE_OFFLINE_SYNC_NS, organizationId), state);
}
