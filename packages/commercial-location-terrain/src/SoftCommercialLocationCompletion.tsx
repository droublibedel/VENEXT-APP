import { useCallback, useEffect, useMemo, useState } from "react";
import { filterCiCities } from "./ci-cities.js";
import { saveGpsLocation, saveManualCity } from "./commercial-location-service.js";
import {
  markSoftLocationPromptDismissed,
} from "./commercial-location-storage.js";
import { reportCommercialLocationEvent } from "./location-observability.js";

export type SoftCommercialLocationCompletionProps = {
  actorId: string;
  sessionKey?: string;
  locale?: "fr" | "en";
  onCompleted?: () => void;
  onDismiss?: () => void;
};

const COPY = {
  fr: {
    message:
      "Ajoutez votre position ou votre ville pour améliorer vos relations commerciales et vos recommandations.",
    city: "Ajouter ma ville",
    gps: "Me localiser maintenant",
    gpsHint:
      "Assurez-vous d'être à votre lieu d'activité avant de partager votre position.",
    gpsDenied: "Ajouter simplement votre ville",
    later: "Plus tard",
    cityPlaceholder: "Ville (ex. Abidjan)",
    save: "Enregistrer",
  },
  en: {
    message: "Add your position or city to improve commercial relations and recommendations.",
    city: "Add my city",
    gps: "Locate me now",
    gpsHint: "Make sure you are at your place of business before sharing your position.",
    gpsDenied: "Simply add your city",
    later: "Later",
    cityPlaceholder: "City (e.g. Abidjan)",
    save: "Save",
  },
};

export function SoftCommercialLocationCompletion({
  actorId,
  sessionKey = "default",
  locale = "fr",
  onCompleted,
  onDismiss,
}: SoftCommercialLocationCompletionProps) {
  const t = COPY[locale];
  const [mode, setMode] = useState<"choice" | "city" | "gps">("choice");
  const [cityQuery, setCityQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [gpsDenied, setGpsDenied] = useState(false);

  const suggestions = useMemo(() => filterCiCities(cityQuery), [cityQuery]);

  const dismiss = useCallback(() => {
    markSoftLocationPromptDismissed(actorId, sessionKey);
    onDismiss?.();
  }, [actorId, sessionKey, onDismiss]);

  const handleCity = useCallback(async () => {
    const city = cityQuery.trim();
    if (!city) return;
    setBusy(true);
    await saveManualCity(actorId, city);
    setBusy(false);
    onCompleted?.();
  }, [actorId, cityQuery, onCompleted]);

  const handleGps = useCallback(async () => {
    setBusy(true);
    const { denied } = await saveGpsLocation(actorId);
    setBusy(false);
    if (denied) {
      setGpsDenied(true);
      setMode("city");
      return;
    }
    onCompleted?.();
  }, [actorId, onCompleted]);

  useEffect(() => {
    reportCommercialLocationEvent("location_soft_prompt_displayed");
  }, []);

  return (
    <section
      data-testid="soft-commercial-location"
      role="region"
      aria-label="Compléter localisation"
      style={{
        margin: "12px 0",
        padding: "14px",
        borderRadius: 12,
        background: "var(--venext-surface-muted, #f4f6f8)",
        border: "1px solid var(--venext-border, #e2e6ea)",
      }}
    >
      <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.45 }}>{t.message}</p>

      {mode === "choice" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" data-testid="loc-btn-city" onClick={() => setMode("city")}>
            {t.city}
          </button>
          <button type="button" data-testid="loc-btn-gps" onClick={() => setMode("gps")}>
            {t.gps}
          </button>
          <button type="button" data-testid="loc-btn-later" onClick={dismiss} style={{ opacity: 0.85 }}>
            {t.later}
          </button>
        </div>
      )}

      {mode === "gps" && (
        <div>
          <p data-testid="gps-hint" style={{ fontSize: 13, marginBottom: 10 }}>
            {t.gpsHint}
          </p>
          <button type="button" data-testid="loc-gps-confirm" disabled={busy} onClick={() => void handleGps()}>
            {t.gps}
          </button>
          <button type="button" onClick={() => setMode("choice")} style={{ marginLeft: 8 }}>
            {t.later}
          </button>
        </div>
      )}

      {mode === "city" && (
        <div>
          {gpsDenied && (
            <p data-testid="gps-denied-fallback" style={{ fontSize: 13, marginBottom: 8 }}>
              {t.gpsDenied}
            </p>
          )}
          <input
            data-testid="loc-city-input"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder={t.cityPlaceholder}
            list="ci-cities-list"
            aria-autocomplete="list"
          />
          <datalist id="ci-cities-list">
            {suggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {suggestions.slice(0, 6).map((c) => (
              <button key={c} type="button" data-testid={`city-chip-${c}`} onClick={() => setCityQuery(c)}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button type="button" data-testid="loc-city-save" disabled={busy || !cityQuery.trim()} onClick={() => void handleCity()}>
              {t.save}
            </button>
            <button type="button" onClick={dismiss}>
              {t.later}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
