import { maskPhone, normalizeCiPhone } from "./phone-normalize.js";
import { issueRegistrationToken } from "./terrain-registration-store.js";
import { issueTerrainOtp, verifyTerrainOtp } from "./terrain-otp-store.js";
import { buildOtpSmsMessage, readYellikaProviderMessage, sendYellikaPlainSms } from "./yellika-sms.client.js";
import { readYellikaSmsConfig } from "./yellika-sms.config.js";

export type RequestTerrainOtpResult =
  | {
      ok: true;
      recipient: string;
      destinationHint: string;
      expiresInSeconds: number;
      delivery: "yellika" | "dev_log";
    }
  | {
      ok: false;
      code: "invalid_phone" | "rate_limited" | "sms_failed";
      userMessage: string;
      retryAfterSeconds?: number;
    };

export type VerifyTerrainOtpResult =
  | { ok: true; recipient: string; verified: true; registrationToken: string }
  | {
      ok: false;
      code: "invalid_phone" | "invalid_code" | "expired" | "too_many_attempts" | "missing_challenge";
      userMessage: string;
    };

export async function requestTerrainOtp(phone: string): Promise<RequestTerrainOtpResult> {
  const recipient = normalizeCiPhone(phone);
  if (!recipient) {
    return {
      ok: false,
      code: "invalid_phone",
      userMessage: "Numéro invalide. Saisissez 10 chiffres au format 07 00 00 00 00.",
    };
  }

  const issued = issueTerrainOtp(recipient);
  if (!issued.ok) {
    return {
      ok: false,
      code: "rate_limited",
      userMessage: "Trop de demandes. Réessayez dans quelques instants.",
      retryAfterSeconds: issued.retryAfterSeconds,
    };
  }

  const yellika = readYellikaSmsConfig();
  const message = buildOtpSmsMessage(yellika?.productName ?? "VENEXT", issued.code);

  if (!yellika) {
    console.info(`[terrain-otp][dev] code for ${maskPhone(recipient)}: ${issued.code}`);
    return {
      ok: true,
      recipient,
      destinationHint: maskPhone(recipient),
      expiresInSeconds: 300,
      delivery: "dev_log",
    };
  }

  const sent = await sendYellikaPlainSms(yellika, recipient, message);
  if (!sent.ok) {
    console.error("[terrain-otp] Yellika send failed", sent.error, sent.providerBody);
    const providerMessage = readYellikaProviderMessage(sent.providerBody);
    return {
      ok: false,
      code: "sms_failed",
      userMessage:
        providerMessage ??
        "Impossible d'envoyer le SMS pour le moment. Utilisez le format +225 07 XX XX XX XX.",
    };
  }

  return {
    ok: true,
    recipient,
    destinationHint: maskPhone(recipient),
    expiresInSeconds: 300,
    delivery: "yellika",
  };
}

export function verifyTerrainOtpCode(phone: string, code: string): VerifyTerrainOtpResult {
  const recipient = normalizeCiPhone(phone);
  if (!recipient) {
    return {
      ok: false,
      code: "invalid_phone",
      userMessage: "Numéro invalide.",
    };
  }

  const result = verifyTerrainOtp(recipient, code);
  if (result.ok) {
    return {
      ok: true,
      recipient,
      verified: true,
      registrationToken: issueRegistrationToken(recipient),
    };
  }

  const messages: Record<typeof result.reason, string> = {
    missing: "Demandez un nouveau code SMS.",
    expired: "Code expiré. Demandez un nouveau code.",
    too_many_attempts: "Trop de tentatives. Demandez un nouveau code.",
    invalid: "Code incorrect.",
  };

  return {
    ok: false,
    code: result.reason === "missing" ? "missing_challenge" : result.reason === "invalid" ? "invalid_code" : result.reason,
    userMessage: messages[result.reason],
  };
}
