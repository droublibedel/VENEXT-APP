const SENSITIVE_KEY =
  /password|otp|token|secret|authorization|cookie|session|bearer|api[_-]?key|card|iban|cvv|pin|stack/i;

const SENSITIVE_VALUE = /\b\d{6}\b|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/;

export function sanitizeLivePayload<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string") {
      out[key] = SENSITIVE_VALUE.test(value) ? "[redacted]" : value.slice(0, 2000);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitizeLivePayload(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      out[key] = value.slice(0, 20).map((v) =>
        typeof v === "object" && v ? sanitizeLivePayload(v as Record<string, unknown>) : v,
      );
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

export function sanitizeTechnicalMessage(message: string): string {
  if (!message) return "";
  let m = message.slice(0, 4000);
  if (SENSITIVE_VALUE.test(m)) m = "[redacted technical]";
  return m.replace(/at\s+[\w./<>]+\.(tsx?|js):\d+/g, "at [stack-redacted]");
}
