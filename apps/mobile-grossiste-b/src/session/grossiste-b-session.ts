import { clearGrossisteDataCache } from "../hooks/useGrossisteLiveData";
import { clearGrossisteBOnboardingProfile } from "../onboarding/grossiste-b-onboarding.viewmodel";

export const GROSSISTE_B_LOGOUT_EVENT = "venext:grossiste-b-logout";

type LogoutAuth = {
  logout: () => void;
};

export function performGrossisteBLogout(auth?: LogoutAuth | null): void {
  clearGrossisteBOnboardingProfile();
  clearGrossisteDataCache();
  auth?.logout();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(GROSSISTE_B_LOGOUT_EVENT));
  }
}
