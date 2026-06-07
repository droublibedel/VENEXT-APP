export type DetaillantOnboardingStep = "profile" | "phone" | "identity" | "activities" | "city" | "done";

export type DetaillantOnboardingProfile = {
  phone: string;
  otpVerified: boolean;
  registrationToken?: string;
  displayName: string;
  activities: string[];
  city: string;
  organizationId?: string;
  completedAt?: string;
};

export const DETAILLANT_ONBOARDING_STORAGE_KEY = "detaillant_terrain_onboarding_v1";

export const TERRAIN_ACTIVITY_OPTIONS = [
  "Boissons",
  "Sucre",
  "Chaussures",
  "Vêtements",
  "Électroménager",
  "Alimentation",
  "Téléphones",
  "Climatisation",
  "Beauté",
  "Quincaillerie",
] as const;

export const TERRAIN_CITY_OPTIONS = [
  "Abidjan",
  "Bouaké",
  "Korhogo",
  "Yamoussoukro",
  "San Pedro",
  "Man",
  "Daloa",
  "Gagnoa",
] as const;
