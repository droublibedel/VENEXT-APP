import type {
  VenextActorProfile,
  VenextAuthPreferences,
  VenextAuthSession,
  VenextLocaleTag,
} from "./venext-auth.types";
import {
  VENEXT_LOCALE_STORAGE_KEY,
  VENEXT_PREFERENCES_STORAGE_KEY,
  VENEXT_PROFILE_STORAGE_KEY,
  VENEXT_SESSION_STORAGE_KEY,
} from "./venext-auth.types";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getStorage(): StorageLike | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

function readJson<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

function removeKey(key: string): void {
  getStorage()?.removeItem(key);
}

export function readPersistedSession(): VenextAuthSession | null {
  return readJson<VenextAuthSession>(VENEXT_SESSION_STORAGE_KEY);
}

export function writePersistedSession(session: VenextAuthSession | null): void {
  if (!session) {
    removeKey(VENEXT_SESSION_STORAGE_KEY);
    return;
  }
  writeJson(VENEXT_SESSION_STORAGE_KEY, session);
}

export function readPersistedProfile(): VenextActorProfile | null {
  return readJson<VenextActorProfile>(VENEXT_PROFILE_STORAGE_KEY);
}

export function writePersistedProfile(profile: VenextActorProfile | null): void {
  if (!profile) {
    removeKey(VENEXT_PROFILE_STORAGE_KEY);
    return;
  }
  writeJson(VENEXT_PROFILE_STORAGE_KEY, profile);
}

export function readPersistedLocale(): VenextLocaleTag | null {
  const raw = getStorage()?.getItem(VENEXT_LOCALE_STORAGE_KEY);
  if (!raw) return null;
  if (raw === "fr-CI" || raw === "en" || raw === "ar" || raw === "zh-CN") return raw;
  return null;
}

export function writePersistedLocale(locale: VenextLocaleTag | null): void {
  if (!locale) {
    removeKey(VENEXT_LOCALE_STORAGE_KEY);
    return;
  }
  getStorage()?.setItem(VENEXT_LOCALE_STORAGE_KEY, locale);
}

export function readPersistedPreferences(): VenextAuthPreferences {
  return readJson<VenextAuthPreferences>(VENEXT_PREFERENCES_STORAGE_KEY) ?? {};
}

export function writePersistedPreferences(prefs: VenextAuthPreferences): void {
  writeJson(VENEXT_PREFERENCES_STORAGE_KEY, prefs);
}

export function clearAllAuthPersistence(): void {
  removeKey(VENEXT_SESSION_STORAGE_KEY);
  removeKey(VENEXT_PROFILE_STORAGE_KEY);
  removeKey(VENEXT_PREFERENCES_STORAGE_KEY);
}
