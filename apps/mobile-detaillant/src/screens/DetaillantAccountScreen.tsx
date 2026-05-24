import { lazy, memo, Suspense, useMemo, useState } from "react";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";

import { useVenextAuthOptional } from "venext-auth-foundation";
import { VenextLanguageSelector, useVenextT } from "venext-i18n";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { formatLocalCiPhoneDisplay } from "../onboarding/detaillant-phone";
import { loadDetaillantOnboardingProfile } from "../onboarding/detaillant-onboarding.viewmodel";
import { performDetaillantLogout } from "../session/detaillant-session";
import { mockDetaillantAccount } from "../mocks/detaillant-mock-data";

const DetaillantWalletScreen = lazy(() =>
  import("../wallet/DetaillantWalletScreen").then((m) => ({
    default: m.DetaillantWalletScreen,
  })),
);

export const DetaillantAccountScreen = memo(function DetaillantAccountScreen({
  enabled,
}: {
  enabled: boolean;
  routingInput?: import("commercial-context-routing").CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const auth = useVenextAuthOptional();
  const walletFlag = hydrated && flags.detaillant_wallet_enabled !== false;
  const [showWallet, setShowWallet] = useState(false);
  const fallbackAccount = mockDetaillantAccount();
  const profile = loadDetaillantOnboardingProfile();
  const account = useMemo(
    () => ({
      ...fallbackAccount,
      shopName: profile?.displayName || fallbackAccount.shopName,
      phone: profile?.phone ? formatLocalCiPhoneDisplay(profile.phone) : auth?.profileLabel || fallbackAccount.phone,
      city: profile?.city || fallbackAccount.city,
      organizationId: profile?.organizationId || fallbackAccount.organizationId,
    }),
    [auth?.profileLabel, fallbackAccount, profile],
  );
  const t = useVenextT();

  return (
    <section data-testid="detaillant-screen-account">
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{t("navigation.tabs.account")}</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--venext-text-muted)" }}>{t("profile.subtitle")}</p>
      </header>

      <article className="detaillant-card" data-testid="detaillant-account-identity">
        <p style={{ margin: 0, fontSize: 12, color: "var(--venext-text-muted)" }}>Boutique</p>
        <p style={{ margin: "10px 0 0", fontSize: 20, fontWeight: 800 }}>{account.shopName}</p>
        <span className="detaillant-badge detaillant-badge--ok" style={{ marginTop: 12, display: "inline-flex" }}>
          {account.city}
        </span>
      </article>

      <article className="detaillant-card">
        <p style={{ margin: 0, fontSize: 13, color: "var(--venext-text-muted)" }}>Téléphone</p>
        <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 600 }}>{account.phone}</p>
      </article>

      <article className="detaillant-card">
        <p style={{ margin: 0, fontSize: 13, color: "var(--venext-text-muted)" }}>Activité récente</p>
        <p style={{ margin: "8px 0 0", fontSize: 15 }}>{account.recentActivity}</p>
      </article>

      <h2 style={{ fontSize: 15, margin: "16px 0 10px", color: "var(--venext-text-muted)", fontWeight: 600 }}>{t("settings")}</h2>
      {walletFlag ? (
        <>
          <button
            type="button"
            className="detaillant-btn detaillant-btn--secondary"
            data-testid="detaillant-account-wallet-toggle"
            style={{ width: "100%", minHeight: 44, marginBottom: 12 }}
            onClick={() => setShowWallet((v) => !v)}
          >
            {showWallet ? "Masquer règlements" : "Voir mes règlements (optionnel)"}
          </button>
          {showWallet ? (
            <Suspense fallback={<VenextScreenLoader variant="wallet" />}>
              <DetaillantWalletScreen enabled={enabled} />
            </Suspense>
          ) : null}
        </>
      ) : null}

      <article
        className="detaillant-card"
        data-testid="detaillant-account-settings"
        data-ux-harmony="terrain-profile"
      >
        <div style={{ marginBottom: 12 }}>
          <VenextLanguageSelector testId="detaillant-language-selector" />
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 14 }}>
          Langue : <strong>{account.language}</strong>
        </p>
        <p style={{ margin: "0 0 10px", fontSize: 14 }}>
          Notifications : <strong>{account.notificationsEnabled ? "Activées" : "Désactivées"}</strong>
        </p>
        <p style={{ margin: "0 0 10px", fontSize: 14 }}>
          Visibilité activité : <strong>{account.activityVisible ? "Visible" : "Masquée"}</strong>
        </p>
        <p style={{ margin: 0, fontSize: 14 }}>
          Disponibilité : <strong>{account.availability}</strong>
        </p>
        <button
          type="button"
          className="detaillant-action"
          data-testid="detaillant-account-logout"
          onClick={() => performDetaillantLogout(auth)}
          style={{
            marginTop: 16,
            width: "100%",
            minHeight: 44,
            borderColor: "var(--venext-danger, #b42318)",
            color: "var(--venext-danger, #b42318)",
          }}
        >
          {t("logout")}
        </button>
      </article>
    </section>
  );
});
