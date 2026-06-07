export type TerrainOnboardingStepKey = "profile" | "phone" | "identity" | "activities" | "city";

export const TERRAIN_ONBOARDING_STEP_LABELS: Record<TerrainOnboardingStepKey, string> = {
  profile: "Commençons",
  phone: "Votre numéro",
  identity: "Votre identité",
  activities: "Vos activités",
  city: "Votre ville",
};

export function terrainOnboardingProgressLabel(
  stepIndex: number,
  stepKey: TerrainOnboardingStepKey,
): string {
  return `Étape ${stepIndex} sur 5 — ${TERRAIN_ONBOARDING_STEP_LABELS[stepKey]}`;
}
