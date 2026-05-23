import { memo } from "react";

import { useVenextAuthOptional } from "venext-auth-foundation";
import { VenextLanguageSelector, useVenextT } from "venext-i18n";

import { BusinessProfileAudioSection } from "terrain-commercial-audio";

import { mockGrossisteProfile } from "../mocks/grossiste-b-mock-data";

export const GrossisteProfileScreen = memo(function GrossisteProfileScreen({
  enabled: _enabled,
}: {
  enabled: boolean;
}) {
  const profile = mockGrossisteProfile();
  const auth = useVenextAuthOptional();
  const t = useVenextT();

  return (
    <section data-testid="grossiste-screen-profile">
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("profile.title")}</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8fa39a" }}>{t("profile.subtitle")}</p>
      </header>

      <article className="grossiste-b-card" data-testid="grossiste-profile-identity">
        <p style={{ margin: 0, fontSize: 11, color: "#8fa39a", textTransform: "uppercase" }}>Identité</p>
        <p style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 700 }}>{profile.commercialName}</p>
        <span
          className="grossiste-b-badge grossiste-b-badge--demand"
          style={{ marginTop: 10, display: "inline-flex" }}
        >
          {profile.networkBadge}
        </span>
      </article>

      <article className="grossiste-b-card" data-testid="grossiste-profile-business-audio">
        <BusinessProfileAudioSection ownerActorId="org-grossiste-b-demo" />
      </article>

      <article className="grossiste-b-card">
        <p style={{ margin: 0, fontSize: 13, color: "#8fa39a" }}>Activité récente</p>
        <p style={{ margin: "6px 0 0", fontSize: 14 }}>{profile.recentActivity}</p>
      </article>

      <article className="grossiste-b-card">
        <p style={{ margin: 0, fontSize: 13, color: "#8fa39a" }}>Couverture villes</p>
        <p style={{ margin: "6px 0 0", fontSize: 14 }} data-testid="grossiste-profile-cities">
          {profile.cityCoverage.join(" · ")}
        </p>
      </article>

      <article className="grossiste-b-card">
        <p style={{ margin: 0, fontSize: 13, color: "#8fa39a" }}>{t("phone")}</p>
        <p style={{ margin: "6px 0 0", fontSize: 14 }}>{profile.phone}</p>
      </article>

      <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "#8fa39a" }}>{t("settings")}</h2>
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
            onClick={() => auth.logout()}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #2a3530",
              background: "transparent",
              color: "#e8a090",
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
