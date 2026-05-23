import type { DetaillantOnboardingProfile } from "./detaillant-onboarding.types";
import { DETAILLANT_ONBOARDING_STORAGE_KEY } from "./detaillant-onboarding.types";

export const MOCK_OTP_CODE = "123456";

export function createEmptyDetaillantProfile(): DetaillantOnboardingProfile {
  return {
    phone: "",
    otpVerified: false,
    displayName: "",
    activities: [],
    city: "",
  };
}

export function loadDetaillantOnboardingProfile(): DetaillantOnboardingProfile | null {
  try {
    const raw = localStorage.getItem(DETAILLANT_ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DetaillantOnboardingProfile;
  } catch {
    return null;
  }
}

export function saveDetaillantOnboardingProfile(profile: DetaillantOnboardingProfile): void {
  localStorage.setItem(
    DETAILLANT_ONBOARDING_STORAGE_KEY,
    JSON.stringify({ ...profile, completedAt: new Date().toISOString() }),
  );
}

export function isDetaillantOnboardingComplete(): boolean {
  const p = loadDetaillantOnboardingProfile();
  return Boolean(p?.completedAt && p.otpVerified && p.displayName.trim() && p.city);
}

export function validateDetaillantPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8;
}

export function validateDetaillantOtp(otp: string): boolean {
  return otp.trim() === MOCK_OTP_CODE;
}
