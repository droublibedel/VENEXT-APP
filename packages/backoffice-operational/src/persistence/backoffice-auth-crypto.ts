/** Hachage isomorphe (Node + navigateur) — évite node:crypto dans le bundle Next. */
export function hashBackofficeSecret(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `bo_${(hash >>> 0).toString(16)}`;
}

export function generateBackofficeToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `bo_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `bo_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function generateBackofficeOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
