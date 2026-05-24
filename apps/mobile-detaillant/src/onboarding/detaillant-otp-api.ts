import { toInternationalCiPhone } from "./detaillant-phone";

export type RequestOtpResponse =
  | {
      ok: true;
      destinationHint: string;
      expiresInSeconds: number;
      delivery: "yellika" | "dev_log";
    }
  | {
      ok: false;
      code: string;
      userMessage: string;
      retryAfterSeconds?: number;
    };

export type VerifyOtpResponse =
  | { ok: true; verified: true; destinationHint?: string; registrationToken?: string }
  | { ok: false; code: string; userMessage: string };

export async function requestDetaillantOtp(phone: string): Promise<RequestOtpResponse> {
  const res = await fetch("/api/auth/terrain/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ phone: toInternationalCiPhone(phone) }),
  });
  return (await res.json()) as RequestOtpResponse;
}

export async function verifyDetaillantOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
  const res = await fetch("/api/auth/terrain/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ phone: toInternationalCiPhone(phone), code }),
  });
  return (await res.json()) as VerifyOtpResponse;
}

export function isValidOtpInput(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
