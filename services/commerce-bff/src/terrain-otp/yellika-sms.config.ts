export type YellikaSmsConfig = {
  baseUrl: string;
  token: string;
  senderId: string;
  productName: string;
  connectTimeoutMs: number;
  readTimeoutMs: number;
};

export function readYellikaSmsConfig(): YellikaSmsConfig | null {
  const token = process.env.YELLIKA_SMS_TOKEN?.trim();
  if (!token) return null;

  return {
    baseUrl: (process.env.YELLIKA_SMS_BASE_URL ?? "https://panel.yellikasms.com").replace(/\/$/, ""),
    token,
    senderId: process.env.YELLIKA_SMS_SENDER_ID?.trim() || "VENEXT",
    productName: process.env.SMS_OTP_PRODUCT_NAME?.trim() || "VENEXT",
    connectTimeoutMs: Number(process.env.YELLIKA_SMS_CONNECT_TIMEOUT_MS ?? 5000),
    readTimeoutMs: Number(process.env.YELLIKA_SMS_READ_TIMEOUT_MS ?? 10000),
  };
}
