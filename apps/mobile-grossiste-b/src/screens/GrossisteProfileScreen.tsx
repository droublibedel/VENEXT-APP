import { memo } from "react";

import { performGrossisteBLogout } from "../session/grossiste-b-session";
import { TerrainProfileSettingsSection } from "commerce-terrain-profile-runtime";
import { useVenextAuthOptional } from "venext-auth-foundation";
import { VenextLanguageSelector, useVenextT } from "venext-i18n";

import { BusinessProfileAudioSection } from "terrain-commercial-audio";

import { mockGrossisteProfile } from "../mocks/grossiste-b-mock-data";

export const GrossisteProfileScreen = memo(function GrossisteProfileScreen({
  enabled: _enabled,
  onOpenWallet,
}: {
  enabled: boolean;
  onOpenWallet?: () => void;
}) {
  const profile = mockGrossisteProfile();
  const auth = useVenextAuthOptional();
  const t = useVenextT();

  return (
    <section data-testid="grossiste-screen-profile">
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("profile.title")}</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--venext-text-muted)" }}>{t("profile.subtitle")}</p>
      </header>

      <article className="grossiste-b-card" data-testid="grossiste-profile-identity">
        <p style={{ margin: 0, fontSize: 11, color: "var(--venext-text-muted)", textTransform: "uppercase" }}>Identité</p>
        <p style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 700 }}>{profile.commercialName}</p>
        <span
          className="grossiste-b-badge grossiste-b-badge--demand"
          style={{ marginTop: 10, display: "inline-flex" }}
        >
          {profile.networkBadge}
        </span>
      </article>

      {onOpenWallet ? (
        <button
          type="button"
          className="grossiste-b-card"
          data-testid="grossiste-profile-open-wallet"
          onClick={onOpenWallet}
          style={{
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            border: "1px solid var(--venext-border)",
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: "var(--venext-text-muted)", textTransform: "uppercase" }}>
            Règlements
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 600 }}>Portefeuille & encaissements</p>
        </button>
      ) : null}

      <article className="grossiste-b-card" data-testid="grossiste-profile-business-audio">
        <BusinessProfileAudioSection ownerActorId="org-grossiste-b-demo" />
      </article>

      <article className="grossiste-b-card">
        <p style={{ margin: 0, fontSize: 13, color: "var(--venext-text-muted)" }}>Activité récente</p>
        <p style={{ margin: "6px 0 0", fontSize: 14 }}>{profile.recentActivity}</p>
      </article>

      <article className="grossiste-b-card">
        <p style={{ margin: 0, fontSize: 13, color: "var(--venext-text-muted)" }}>Couverture villes</p>
        <p style={{ margin: "6px 0 0", fontSize: 14 }} data-testid="grossiste-profile-cities">
          {profile.cityCoverage.join(" · ")}
        </p>
      </article>

      <article className="grossiste-b-card">
        <p style={{ margin: 0, fontSize: 13, color: "var(--venext-text-muted)" }}>{t("phone")}</p>
        <p style={{ margin: "6px 0 0", fontSize: 14 }}>{profile.phone}</p>
      </article>

      <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "var(--venext-text-muted)" }}>{t("settings")}</h2>
      <TerrainProfileSettingsSection className="grossiste-b-card" />
      <article
        className="grossiste-b-card"
        data-testid="grossiste-profile-settings"
        data-ux-harmony="terrain-profile"
      >
        <div style={{ marginBottom: 12 }}>
          <VenextLanguageSelector />
        </div>
        <p style={{ margin: "0 0 8px", fontSize: 13 }}>
          {t("notifications")} : <strong>{profile.notificationsEnabled ? t("notifications") : "—"}</strong>
        </p>
        <p style={{ margin: "0 0 8px", fontSize: 13 }}>
          Disponibilité : <strong>{profile.availability}</strong>
        </p>
        <p style={{ margin: 0, fontSize: 13 }}>
          Catalogue visible : <strong>{profile.catalogVisible ? "Oui" : "Non"}</strong>
        </p>
        {auth ? (
          <button
            type="button"
            data-testid="grossiste-auth-logout"
            onClick={() => performGrossisteBLogout(auth)}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--venext-border)",
              background: "transparent",
              color: "var(--venext-danger)",
              fontSize: 14,
            }}
          >
            {t("logout")}
          </button>
        ) : null}
      </article>
    </section>
  );
});
