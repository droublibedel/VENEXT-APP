const NAV_LOCK_KEY = "venext:wallet-nav-locked";
const NAV_SAFE_ROUTE_KEY = "venext:wallet-safe-route";
const NAV_SENSITIVE_STACK_KEY = "venext:wallet-sensitive-stack";

export const SENSITIVE_WALLET_ROUTES = [
  "wallet",
  "settlements",
  "wallet-history",
  "wallet-activation",
  "kyc",
  "pin-flow",
  "secured-pin",
] as const;

export type SensitiveWalletRoute = (typeof SENSITIVE_WALLET_ROUTES)[number];

function readSession(key: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore quota */
  }
}

function removeSession(key: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function isSensitiveWalletRoute(route: string): boolean {
  const normalized = route.toLowerCase().replace(/^\/+/, "");
  return SENSITIVE_WALLET_ROUTES.some(
    (r) => normalized === r || normalized.startsWith(`${r}/`) || normalized.includes(`/${r}`),
  );
}

/** Instruction 20.85-A — empêche retour Android vers écran wallet sensible après lock. */
export function secureWalletNavigationReset(safeRoute = "wallet-lock"): void {
  writeSession(NAV_LOCK_KEY, "1");
  writeSession(NAV_SAFE_ROUTE_KEY, safeRoute);
  writeSession(NAV_SENSITIVE_STACK_KEY, "[]");
}

export function clearSensitiveNavigationHistory(): void {
  writeSession(NAV_SENSITIVE_STACK_KEY, "[]");
}

export function isWalletNavigationLocked(): boolean {
  return readSession(NAV_LOCK_KEY) === "1";
}

export function releaseWalletNavigationLock(): void {
  removeSession(NAV_LOCK_KEY);
}

export function getPostLockSafeRoute(fallback = "wallet-shell"): string {
  return readSession(NAV_SAFE_ROUTE_KEY) ?? fallback;
}

export function assertAndroidBackFromWalletBlocked(currentRoute: string): boolean {
  if (!isWalletNavigationLocked()) return false;
  if (!isSensitiveWalletRoute(currentRoute)) return false;
  return true;
}

export function pushSensitiveNavigationRoute(route: string): void {
  if (!isSensitiveWalletRoute(route)) return;
  const raw = readSession(NAV_SENSITIVE_STACK_KEY);
  let stack: string[] = [];
  try {
    stack = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    stack = [];
  }
  if (stack[stack.length - 1] !== route) {
    stack.push(route);
    writeSession(NAV_SENSITIVE_STACK_KEY, JSON.stringify(stack.slice(-8)));
  }
}

export function consumePostLockNavigationIntent(): {
  blocked: boolean;
  safeRoute: string;
} {
  const blocked = isWalletNavigationLocked();
  return { blocked, safeRoute: getPostLockSafeRoute() };
}
