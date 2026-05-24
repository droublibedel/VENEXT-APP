import { randomInt } from "node:crypto";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

type OtpRecord = {
  code: string;
  expiresAt: number;
  attempts: number;
  sendTimestamps: number[];
};

const store = new Map<string, OtpRecord>();

export function resetTerrainOtpStoreForTests() {
  store.clear();
}

export function peekTerrainOtpForTests(recipient: string): string | null {
  return store.get(recipient)?.code ?? null;
}

export function generateTerrainOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function issueTerrainOtp(recipient: string): {
  ok: true;
  code: string;
  expiresAt: number;
  retryAfterSeconds?: number;
} | {
  ok: false;
  reason: "rate_limited";
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const existing = store.get(recipient);
  const recentSends = (existing?.sendTimestamps ?? []).filter((t) => now - t < SEND_WINDOW_MS);

  if (recentSends.length >= MAX_SENDS_PER_WINDOW) {
    const oldest = recentSends[0] ?? now;
    const retryAfterSeconds = Math.ceil((SEND_WINDOW_MS - (now - oldest)) / 1000);
    return { ok: false, reason: "rate_limited", retryAfterSeconds };
  }

  if (recentSends.length > 0) {
    const lastSent = recentSends[recentSends.length - 1] ?? now;
    const sinceLast = now - lastSent;
    if (sinceLast < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "rate_limited",
        retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000),
      };
    }
  }

  const code = generateTerrainOtpCode();
  const expiresAt = now + OTP_TTL_MS;
  store.set(recipient, {
    code,
    expiresAt,
    attempts: 0,
    sendTimestamps: [...recentSends, now],
  });

  return { ok: true, code, expiresAt };
}

export function verifyTerrainOtp(
  recipient: string,
  code: string,
): { ok: true } | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" | "missing" } {
  const record = store.get(recipient);
  if (!record) return { ok: false, reason: "missing" };

  if (Date.now() > record.expiresAt) {
    store.delete(recipient);
    return { ok: false, reason: "expired" };
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    store.delete(recipient);
    return { ok: false, reason: "too_many_attempts" };
  }

  record.attempts += 1;

  if (record.code !== code.trim()) {
    return { ok: false, reason: "invalid" };
  }

  store.delete(recipient);
  return { ok: true };
}
