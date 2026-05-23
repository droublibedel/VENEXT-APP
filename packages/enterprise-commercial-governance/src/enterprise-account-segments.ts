import type { AccountSegment } from "./enterprise-governance.types";

export function resolveAccountSegment(actorKind: string): AccountSegment {
  if (actorKind === "grossiste_b" || actorKind === "detaillant") return "SMALL_ACCOUNTS";
  if (actorKind === "producteur" || actorKind === "grossiste_a") return "LARGE_ACCOUNTS";
  return "SMALL_ACCOUNTS";
}

export function isLargeAccountSegment(segment: AccountSegment): boolean {
  return segment === "LARGE_ACCOUNTS";
}

export function requiresSupervisedOnboarding(segment: AccountSegment): boolean {
  return segment === "LARGE_ACCOUNTS";
}
