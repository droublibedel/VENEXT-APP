import { getOfflineTranslation } from "./commerce-offline-i18n";
import type { CommerceConnectivityMode } from "./commerce-offline.types";

type Props = {
  mode: CommerceConnectivityMode;
  locale?: string;
};

export function CommerceOfflineBanner({ mode, locale = "fr-CI" }: Props) {
  if (mode === "ONLINE") return null;
  const degraded = mode === "DEGRADED";
  return (
    <div
      className={`cof-banner${degraded ? " cof-banner--degraded" : " cof-banner--offline"}`}
      data-testid={`cof-banner-${mode.toLowerCase()}`}
      role="status"
    >
      {getOfflineTranslation(degraded ? "offline.banner.weak" : "offline.banner.offline", locale)}
    </div>
  );
}
