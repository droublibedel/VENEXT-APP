import { DETAILLANT_ORG_ID } from "../mocks/detaillant-mock-data";
import { loadDetaillantOnboardingProfile } from "../onboarding/detaillant-onboarding.viewmodel";

export function resolveDetaillantOrganizationId(): string {
  const profile = loadDetaillantOnboardingProfile();
  if (profile?.organizationId) return profile.organizationId;
  return DETAILLANT_ORG_ID;
}

export function resolveDetaillantActorId(): string {
  return resolveDetaillantOrganizationId();
}
