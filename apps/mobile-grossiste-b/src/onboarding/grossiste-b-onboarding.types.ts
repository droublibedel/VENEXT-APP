export type GrossisteBOnboardingStep = "phone" | "identity" | "activities" | "city" | "done";

export type GrossisteBOnboardingProfile = {
  phone: string;
  otpVerified: boolean;
  displayName: string;
  businessName?: string;
  activities: string[];
  city: string;
  completedAt?: string;
};

export const GROSSISTE_B_ONBOARDING_STORAGE_KEY = "grossiste_b_terrain_onboarding_v1";

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
