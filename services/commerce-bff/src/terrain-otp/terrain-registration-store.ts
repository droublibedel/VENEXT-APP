import { randomUUID } from "node:crypto";

const REGISTRATION_TTL_MS = 30 * 60 * 1000;

type RegistrationRecord = {
  phone: string;
  expiresAt: number;
};

const store = new Map<string, RegistrationRecord>();

export function resetTerrainRegistrationStoreForTests() {
  store.clear();
}

export function issueRegistrationToken(normalizedPhone: string): string {
  const token = randomUUID();
  store.set(token, {
    phone: normalizedPhone,
    expiresAt: Date.now() + REGISTRATION_TTL_MS,
  });
  return token;
}

export function consumeRegistrationToken(normalizedPhone: string, token: string): boolean {
  const record = store.get(token);
  if (!record || record.phone !== normalizedPhone || Date.now() > record.expiresAt) {
    return false;
  }
  store.delete(token);
  return true;
}

export function verifyRegistrationToken(normalizedPhone: string, token: string): boolean {
  const record = store.get(token);
  return Boolean(record && record.phone === normalizedPhone && Date.now() <= record.expiresAt);
}
