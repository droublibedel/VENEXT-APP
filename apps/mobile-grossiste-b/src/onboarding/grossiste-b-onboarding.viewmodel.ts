import type { GrossisteBOnboardingProfile } from "./grossiste-b-onboarding.types";
import { GROSSISTE_B_ONBOARDING_STORAGE_KEY } from "./grossiste-b-onboarding.types";

export const MOCK_OTP_CODE = "123456";

export function createEmptyGrossisteBProfile(): GrossisteBOnboardingProfile {
  return {
    phone: "",
    otpVerified: false,
    displayName: "",
    businessName: undefined,
    activities: [],
    city: "",
  };
}

export function loadGrossisteBOnboardingProfile(): GrossisteBOnboardingProfile | null {
  try {
    const raw = localStorage.getItem(GROSSISTE_B_ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GrossisteBOnboardingProfile;
  } catch {
    return null;
  }
}

export function saveGrossisteBOnboardingProfile(profile: GrossisteBOnboardingProfile): void {
  localStorage.setItem(
    GROSSISTE_B_ONBOARDING_STORAGE_KEY,
    JSON.stringify({ ...profile, completedAt: new Date().toISOString() }),
  );
}

export function isGrossisteBOnboardingComplete(): boolean {
  const p = loadGrossisteBOnboardingProfile();
  return Boolean(p?.completedAt && p.otpVerified && p.displayName.trim() && p.city);
}

export function validateGrossisteBPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8;
}

export function validateGrossisteBOtp(otp: string): boolean {
  return otp.trim() === MOCK_OTP_CODE;
}
