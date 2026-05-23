import type { BackofficeOtpChallenge, BackofficeSession } from "../types/auth.types.js";
import { getBackofficeStore } from "../store/backoffice-store.js";
import { resolveBackofficePersistenceMode } from "../persistence/persistence-mode.js";
import { getBackofficePrisma } from "../persistence/prisma.js";
import {
  generateBackofficeOtpCode,
  generateBackofficeToken,
  hashBackofficeSecret,
} from "../persistence/backoffice-auth-crypto.js";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export class BackofficeAuthRepository {
  private memoryOtp(): Map<string, BackofficeOtpChallenge> {
    return getBackofficeStore().otpChallenges;
  }

  private memorySessions(): Map<string, BackofficeSession> {
    return getBackofficeStore().sessions;
  }

  async recordAuthAttempt(email: string, kind: string, success: boolean, ipHint?: string): Promise<void> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return;
    try {
      await getBackofficePrisma().backofficeAuthAttempt.create({
        data: { email, kind, success, ipHint },
      });
    } catch {
      /* HYBRID: non bloquant */
    }
  }

  async upsertOtpChallenge(email: string, code: string): Promise<BackofficeOtpChallenge> {
    const normalized = email.trim().toLowerCase();
    const challenge: BackofficeOtpChallenge = {
      email: normalized,
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      attempts: 0,
    };

    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      this.memoryOtp().set(normalized, challenge);
      return challenge;
    }

    try {
      await getBackofficePrisma().backofficeOtpChallenge.upsert({
        where: { email: normalized },
        create: {
          email: normalized,
          codeHash: hashBackofficeSecret(code),
          expiresAt: new Date(challenge.expiresAt),
          attempts: 0,
        },
        update: {
          codeHash: hashBackofficeSecret(code),
          expiresAt: new Date(challenge.expiresAt),
          attempts: 0,
        },
      });
      if (mode === "HYBRID") this.memoryOtp().set(normalized, challenge);
      return challenge;
    } catch {
      if (mode === "HYBRID") {
        this.memoryOtp().set(normalized, challenge);
        return challenge;
      }
      throw new Error("backoffice_otp_persist_failed");
    }
  }

  async findOtpChallenge(email: string): Promise<BackofficeOtpChallenge | null> {
    const normalized = email.trim().toLowerCase();
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return this.memoryOtp().get(normalized) ?? null;

    try {
      const row = await getBackofficePrisma().backofficeOtpChallenge.findUnique({
        where: { email: normalized },
      });
      if (!row) {
        if (mode === "HYBRID") return this.memoryOtp().get(normalized) ?? null;
        return null;
      }
      return {
        email: normalized,
        code: "",
        expiresAt: row.expiresAt.toISOString(),
        attempts: row.attempts,
      };
    } catch {
      if (mode === "HYBRID") return this.memoryOtp().get(normalized) ?? null;
      return null;
    }
  }

  async verifyOtpCode(email: string, code: string): Promise<{ ok: true } | { ok: false; code: string }> {
    const normalized = email.trim().toLowerCase();
    const trimmed = code.trim();
    const mode = resolveBackofficePersistenceMode();

    if (mode === "FALLBACK") {
      const challenge = this.memoryOtp().get(normalized);
      if (!challenge) return { ok: false, code: "otp_missing" };
      if (new Date(challenge.expiresAt).getTime() < Date.now()) {
        this.memoryOtp().delete(normalized);
        return { ok: false, code: "otp_expired" };
      }
      if (challenge.attempts >= MAX_OTP_ATTEMPTS) return { ok: false, code: "otp_locked" };
      if (challenge.code !== trimmed) {
        challenge.attempts += 1;
        this.memoryOtp().set(normalized, challenge);
        return { ok: false, code: "otp_invalid" };
      }
      this.memoryOtp().delete(normalized);
      return { ok: true };
    }

    try {
      const row = await getBackofficePrisma().backofficeOtpChallenge.findUnique({
        where: { email: normalized },
      });
      if (!row) return { ok: false, code: "otp_missing" };
      if (row.expiresAt.getTime() < Date.now()) {
        await getBackofficePrisma().backofficeOtpChallenge.delete({ where: { email: normalized } });
        return { ok: false, code: "otp_expired" };
      }
      if (row.attempts >= MAX_OTP_ATTEMPTS) return { ok: false, code: "otp_locked" };
      if (row.codeHash !== hashBackofficeSecret(trimmed)) {
        await getBackofficePrisma().backofficeOtpChallenge.update({
          where: { email: normalized },
          data: { attempts: row.attempts + 1 },
        });
        return { ok: false, code: "otp_invalid" };
      }
      await getBackofficePrisma().backofficeOtpChallenge.delete({ where: { email: normalized } });
      this.memoryOtp().delete(normalized);
      return { ok: true };
    } catch {
      if (mode === "HYBRID") {
        const challenge = this.memoryOtp().get(normalized);
        if (!challenge) return { ok: false, code: "otp_missing" };
        if (new Date(challenge.expiresAt).getTime() < Date.now()) {
          this.memoryOtp().delete(normalized);
          return { ok: false, code: "otp_expired" };
        }
        if (challenge.attempts >= MAX_OTP_ATTEMPTS) return { ok: false, code: "otp_locked" };
        if (challenge.code !== trimmed) {
          challenge.attempts += 1;
          this.memoryOtp().set(normalized, challenge);
          return { ok: false, code: "otp_invalid" };
        }
        this.memoryOtp().delete(normalized);
        return { ok: true };
      }
      return { ok: false, code: "otp_missing" };
    }
  }

  async createSession(email: string, operatorId: string): Promise<BackofficeSession> {
    const normalized = email.trim().toLowerCase();
    const token = generateBackofficeToken();
    const session: BackofficeSession = {
      token,
      email: normalized,
      operatorId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };

    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") {
      this.memorySessions().set(token, session);
      return session;
    }

    try {
      await getBackofficePrisma().backofficeOperatorSession.create({
        data: {
          email: normalized,
          operatorId,
          tokenHash: hashBackofficeSecret(token),
          expiresAt: new Date(session.expiresAt),
        },
      });
      if (mode === "HYBRID") this.memorySessions().set(token, session);
      return session;
    } catch {
      if (mode === "HYBRID") {
        this.memorySessions().set(token, session);
        return session;
      }
      throw new Error("backoffice_session_persist_failed");
    }
  }

  async resolveSession(token: string | undefined): Promise<BackofficeSession | null> {
    if (!token?.trim()) return null;
    const trimmed = token.trim();
    const mode = resolveBackofficePersistenceMode();

    if (mode === "FALLBACK") {
      const session = this.memorySessions().get(trimmed);
      if (!session) return null;
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        this.memorySessions().delete(trimmed);
        return null;
      }
      return session;
    }

    try {
      const row = await getBackofficePrisma().backofficeOperatorSession.findFirst({
        where: { tokenHash: hashBackofficeSecret(trimmed), expiresAt: { gt: new Date() } },
      });
      if (!row) {
        if (mode === "HYBRID") return this.memorySessions().get(trimmed) ?? null;
        return null;
      }
      return {
        token: trimmed,
        email: row.email,
        operatorId: row.operatorId,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      };
    } catch {
      if (mode === "HYBRID") return this.memorySessions().get(trimmed) ?? null;
      return null;
    }
  }

  async deleteSession(token: string | undefined): Promise<boolean> {
    if (!token?.trim()) return false;
    const trimmed = token.trim();
    const mode = resolveBackofficePersistenceMode();
    const memDeleted = this.memorySessions().delete(trimmed);

    if (mode === "FALLBACK") return memDeleted;

    try {
      await getBackofficePrisma().backofficeOperatorSession.deleteMany({
        where: { tokenHash: hashBackofficeSecret(trimmed) },
      });
      return true;
    } catch {
      return memDeleted;
    }
  }

  async trustDevice(email: string, deviceKey: string, ttlDays = 30): Promise<void> {
    const mode = resolveBackofficePersistenceMode();
    if (mode === "FALLBACK") return;
    try {
      await getBackofficePrisma().backofficeTrustedDevice.upsert({
        where: { email_deviceKey: { email: email.trim().toLowerCase(), deviceKey } },
        create: {
          email: email.trim().toLowerCase(),
          deviceKey,
          expiresAt: new Date(Date.now() + ttlDays * 86400_000),
        },
        update: { trustedAt: new Date(), expiresAt: new Date(Date.now() + ttlDays * 86400_000) },
      });
    } catch {
      /* optional */
    }
  }
}

let singleton: BackofficeAuthRepository | null = null;
export function getBackofficeAuthRepository(): BackofficeAuthRepository {
  if (!singleton) singleton = new BackofficeAuthRepository();
  return singleton;
}

export { generateBackofficeOtpCode, OTP_TTL_MS, MAX_OTP_ATTEMPTS };
