import { GROSSISTE_B_ORG_ID } from "../mocks/grossiste-b-mock-data";
import { loadGrossisteBOnboardingProfile } from "../onboarding/grossiste-b-onboarding.viewmodel";

export function resolveGrossisteBOrganizationId(): string {
  const profile = loadGrossisteBOnboardingProfile();
  if (profile?.organizationId) return profile.organizationId;
  return GROSSISTE_B_ORG_ID;
}

export function resolveGrossisteBActorId(): string {
  return resolveGrossisteBOrganizationId();
}
