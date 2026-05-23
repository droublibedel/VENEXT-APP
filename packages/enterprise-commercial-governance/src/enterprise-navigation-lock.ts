const NAV_LOCK_PREFIX = "venext-enterprise-nav-lock:";
const NAV_HISTORY_PREFIX = "venext-enterprise-nav-history:";

function storage(): Storage | undefined {
  if (typeof sessionStorage !== "undefined") return sessionStorage;
  return undefined;
}

/** Bloque retour historique / deep link après suspension (Instruction 20.86-D). */
export function invalidateEnterpriseNavigation(enterpriseId: string, reason = "security"): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(`${NAV_LOCK_PREFIX}${enterpriseId}`, JSON.stringify({ at: Date.now(), reason }));
    s.removeItem(`${NAV_HISTORY_PREFIX}${enterpriseId}`);
  } catch {
    /* ignore */
  }
}

export function clearEnterpriseNavigationHistory(enterpriseId: string): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(`${NAV_HISTORY_PREFIX}${enterpriseId}`);
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k?.startsWith(`${NAV_HISTORY_PREFIX}${enterpriseId}:`)) keys.push(k);
    }
    for (const k of keys) s.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function isEnterpriseNavigationLocked(enterpriseId: string): boolean {
  const s = storage();
  if (!s) return false;
  try {
    return s.getItem(`${NAV_LOCK_PREFIX}${enterpriseId}`) != null;
  } catch {
    return false;
  }
}

export function releaseEnterpriseNavigationLock(enterpriseId: string): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(`${NAV_LOCK_PREFIX}${enterpriseId}`);
  } catch {
    /* ignore */
  }
}

/** Empêche bouton retour Android depuis contexte entreprise verrouillé. */
export function assertAndroidBackBlockedForEnterprise(enterpriseId: string): boolean {
  return isEnterpriseNavigationLocked(enterpriseId);
}
