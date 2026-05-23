import type { Decimal } from "@prisma/client/runtime/library";

export function decToNumber(d: Decimal | null | undefined): number {
  if (d == null) return 0;
  return Number(d.toString());
}

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000));
}
