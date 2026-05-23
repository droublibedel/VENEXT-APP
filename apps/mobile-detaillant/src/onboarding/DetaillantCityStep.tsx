import { memo, useMemo, useState } from "react";

import { TERRAIN_CITY_OPTIONS } from "./detaillant-onboarding.types";

export const DetaillantCityStep = memo(function DetaillantCityStep({
  city,
  onCityChange,
  onFinish,
  onSkip,
}: {
  city: string;
  onCityChange: (v: string) => void;
  onFinish: () => void;
  onSkip?: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...TERRAIN_CITY_OPTIONS];
    return TERRAIN_CITY_OPTIONS.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  return (
    <section data-testid="dt-onboarding-city">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Votre ville (optionnel)</h2>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#8fa39a" }}>
        Vous pourrez aussi l&apos;ajouter plus tard dans l&apos;application.
      </p>
      <input
        className="detaillant-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une ville…"
        data-testid="dt-onboarding-city-search"
        style={{ marginBottom: 12 }}
      />
      <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 220, overflow: "auto" }}>
        {filtered.map((c) => (
          <li key={c}>
            <button
              type="button"
              onClick={() => onCityChange(c)}
              data-testid={`dt-onboarding-city-${c.replace(/\s/g, "-").toLowerCase()}`}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                marginBottom: 4,
                borderRadius: 8,
                border: city === c ? "1px solid #00a884" : "1px solid transparent",
                background: city === c ? "rgba(0,168,132,0.12)" : "#0e1a17",
                color: "#f0f4f2",
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
          className="detaillant-action detaillant-action--primary"
          disabled={!city}
          onClick={onFinish}
          data-testid="dt-onboarding-finish"
          style={{ width: "100%" }}
        >
          Commencer
        </button>
        {onSkip ? (
          <button type="button" className="detaillant-action" onClick={onSkip} data-testid="dt-onboarding-city-skip" style={{ width: "100%" }}>
            Plus tard
          </button>
        ) : null}
      </div>
    </section>
  );
});
