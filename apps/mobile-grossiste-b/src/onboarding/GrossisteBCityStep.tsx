import { memo, useMemo, useState } from "react";

import { TERRAIN_CITY_OPTIONS } from "./grossiste-b-onboarding.types";

export const GrossisteBCityStep = memo(function GrossisteBCityStep({
  city,
  onCityChange,
  onFinish,
  onSkip,
  submitting = false,
}: {
  city: string;
  onCityChange: (v: string) => void;
  onFinish: () => void;
  onSkip?: () => void;
  submitting?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...TERRAIN_CITY_OPTIONS];
    return TERRAIN_CITY_OPTIONS.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  return (
    <section data-testid="gb-onboarding-city">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Votre ville (optionnel)</h2>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--venext-text-muted)" }}>
        Vous pourrez aussi l&apos;ajouter plus tard dans l&apos;application.
      </p>
      <input
        className="grossiste-b-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une ville…"
        data-testid="gb-onboarding-city-search"
        style={{ marginBottom: 12 }}
      />
      <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 220, overflow: "auto" }}>
        {filtered.map((c) => (
          <li key={c}>
            <button
              type="button"
              onClick={() => onCityChange(c)}
              data-testid={`gb-onboarding-city-${c.replace(/\s/g, "-").toLowerCase()}`}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                marginBottom: 4,
                borderRadius: 8,
                border: city === c ? "1px solid var(--venext-accent)" : "1px solid transparent",
                background: city === c ? "var(--venext-accent-soft)" : "var(--venext-surface)",
                color: "var(--venext-text)",
              }}
            >
              {c}
            </button>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        <button
          type="button"
          className="grossiste-b-action grossiste-b-action--primary"
          disabled={!city || submitting}
          onClick={onFinish}
          data-testid="gb-onboarding-finish"
          style={{ width: "100%" }}
        >
          {submitting ? "Enregistrement…" : "Commencer"}
        </button>
        {onSkip ? (
          <button
            type="button"
            className="grossiste-b-action"
            onClick={onSkip}
            data-testid="gb-onboarding-city-skip"
            style={{ width: "100%", opacity: 0.9 }}
          >
            Plus tard
          </button>
        ) : null}
      </div>
    </section>
  );
});
