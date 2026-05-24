import type { YellikaSmsConfig } from "./yellika-sms.config.js";
import { formatInternationalPhone } from "./phone-normalize.js";

export type YellikaSendResult =
  | { ok: true; providerStatus: number; providerBody: unknown }
  | { ok: false; error: string; providerStatus?: number; providerBody?: unknown };

export async function sendYellikaPlainSms(
  config: YellikaSmsConfig,
  recipient: string,
  message: string,
): Promise<YellikaSendResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.connectTimeoutMs + config.readTimeoutMs,
  );

  try {
    const res = await fetch(`${config.baseUrl}/api/v3/sms/send`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        recipient: formatInternationalPhone(recipient),
        sender_id: config.senderId,
        type: "plain",
        message,
      }),
      signal: controller.signal,
    });

    let providerBody: unknown = null;
    try {
      providerBody = await res.json();
    } catch {
      providerBody = null;
    }

    if (!res.ok) {
      return {
        ok: false,
        error: "yellika_send_failed",
        providerStatus: res.status,
        providerBody,
      };
    }

    return { ok: true, providerStatus: res.status, providerBody };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "yellika_network_error";
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildOtpSmsMessage(productName: string, code: string): string {
  return `${productName}: votre code de verification est ${code}. Valide 5 minutes. Ne le partagez pas.`;
}

export function readYellikaProviderMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const message = (body as { message?: string | string[] }).message;
  if (Array.isArray(message)) return message.join(" ").replace(/\s+/g, " ").trim() || null;
  if (typeof message === "string") return message.replace(/\s+/g, " ").trim() || null;
  return null;
}
