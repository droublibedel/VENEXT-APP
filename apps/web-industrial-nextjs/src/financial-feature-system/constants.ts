/** Demo wholesaler org — aligns with `prisma/seed.ts` (Instruction 8 §17). */
export const DEMO_FINANCE_ORG = "31111111-1111-1111-1111-111111111103";
export const DEMO_FINANCE_WALLET = "a1111111-1111-1111-1111-111111111003";
export const DEMO_FINANCE_PRODUCT = "61111111-1111-1111-1111-111111111001";

export function financialWsUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_VENEXT_FINANCIAL_WS) {
    return process.env.NEXT_PUBLIC_VENEXT_FINANCIAL_WS;
  }
  if (typeof window !== "undefined") {
    return `ws://${window.location.hostname}:3000/financial-realtime`;
  }
  return "ws://127.0.0.1:3000/financial-realtime";
}
