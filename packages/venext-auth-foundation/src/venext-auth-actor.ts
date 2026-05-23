import type { VenextActorRole } from "./venext-auth.types";

export function isTerrainActor(role: VenextActorRole): boolean {
  return role === "GROSSISTE_B" || role === "DETAILLANT";
}

export function isFormalActor(role: VenextActorRole): boolean {
  return role === "PRODUCER" || role === "GROSSISTE_A";
}

export function toGovernanceActorSlug(
  role: VenextActorRole,
): "producteur" | "grossiste_a" | "grossiste_b" | "detaillant" {
  switch (role) {
    case "PRODUCER":
      return "producteur";
    case "GROSSISTE_A":
      return "grossiste_a";
    case "GROSSISTE_B":
      return "grossiste_b";
    case "DETAILLANT":
      return "detaillant";
    default:
      return "detaillant";
  }
}

export function assertActorMatch(
  expected: VenextActorRole,
  actual: VenextActorRole | null | undefined,
): boolean {
  return Boolean(actual && actual === expected);
}

export function defaultWorkspaceForActor(role: VenextActorRole): string {
  switch (role) {
    case "PRODUCER":
      return "relational-commercial";
    case "GROSSISTE_A":
      return "overview";
    case "GROSSISTE_B":
      return "activity";
    case "DETAILLANT":
      return "home";
    default:
      return "home";
  }
}

export function defaultTabForActor(role: VenextActorRole): string {
  return defaultWorkspaceForActor(role);
}
