import {
  isDetaillantOnboardingComplete,
  loadDetaillantOnboardingProfile,
  saveDetaillantOnboardingProfile,
} from "@venext/mobile-detaillant/onboarding/detaillant-onboarding.viewmodel";
import {
  isGrossisteBOnboardingComplete,
  loadGrossisteBOnboardingProfile,
  saveGrossisteBOnboardingProfile,
} from "@venext/mobile-grossiste-b/onboarding/grossiste-b-onboarding.viewmodel";

export function mirrorDetaillantOnboardingForGrossiste(): void {
  if (isGrossisteBOnboardingComplete()) return;
  const detaillant = loadDetaillantOnboardingProfile();
  if (!detaillant?.phone || !detaillant.displayName) return;
  const existing = loadGrossisteBOnboardingProfile();
  saveGrossisteBOnboardingProfile({
    phone: detaillant.phone,
    otpVerified: detaillant.otpVerified,
    displayName: detaillant.displayName,
    activities: detaillant.activities ?? [],
    city: detaillant.city || "Abidjan",
    organizationId: detaillant.organizationId ?? existing?.organizationId,
    completedAt: detaillant.completedAt ?? new Date().toISOString(),
  });
}

export function mirrorGrossisteOnboardingForDetaillant(): void {
  if (isDetaillantOnboardingComplete()) return;
  const grossiste = loadGrossisteBOnboardingProfile();
  if (!grossiste?.phone || !grossiste.displayName) return;
  const existing = loadDetaillantOnboardingProfile();
  saveDetaillantOnboardingProfile({
    phone: grossiste.phone,
    otpVerified: grossiste.otpVerified,
    displayName: grossiste.displayName,
    activities: grossiste.activities ?? [],
    city: grossiste.city || "Abidjan",
    organizationId: grossiste.organizationId ?? existing?.organizationId,
    completedAt: grossiste.completedAt ?? new Date().toISOString(),
  });
}
