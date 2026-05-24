import { clearDetaillantDataCache } from "../hooks/useDetaillantLiveData";
import { clearDetaillantOnboardingProfile } from "../onboarding/detaillant-onboarding.viewmodel";

export const DETAILLANT_LOGOUT_EVENT = "venext:detaillant-logout";

type LogoutAuth = {
  logout: () => void;
};

export function performDetaillantLogout(auth?: LogoutAuth | null): void {
  clearDetaillantOnboardingProfile();
  clearDetaillantDataCache();
  auth?.logout();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DETAILLANT_LOGOUT_EVENT));
  }
}
