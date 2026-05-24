import { memo, useMemo } from "react";

import { TERRAIN_ACTIVITY_OPTIONS } from "./grossiste-b-onboarding.types";

export const GrossisteBActivitiesStep = memo(function GrossisteBActivitiesStep({
  selected,
  onToggle,
  onNext,
}: {
  selected: string[];
  onToggle: (activity: string) => void;
  onNext: () => void;
}) {
  const canContinue = selected.length > 0;

  const chips = useMemo(() => TERRAIN_ACTIVITY_OPTIONS, []);

  return (
    <section data-testid="gb-onboarding-activities">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Vos activités</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--venext-text-muted)" }}>
        Choisissez une ou plusieurs — sélection rapide.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {chips.map((a) => {
          const active = selected.includes(a);
          return (
            <button
              key={a}
              type="button"
              className={`grossiste-b-chip${active ? " grossiste-b-chip--active" : ""}`}
              data-testid={`gb-onboarding-activity-${a.replace(/\s/g, "-").toLowerCase()}`}
              data-selected={active ? "true" : "false"}
              onClick={() => onToggle(a)}
              style={{
                padding: "8px 12px",
                borderRadius: 20,
                border: `1px solid ${active ? "var(--venext-accent)" : "var(--venext-border)"}`,
                background: active ? "var(--venext-accent-soft)" : "var(--venext-surface)",
                color: "var(--venext-text)",
                fontSize: 12,
              }}
            >
              {a}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="grossiste-b-action grossiste-b-action--primary"
        disabled={!canContinue}
        onClick={onNext}
        data-testid="gb-onboarding-activities-next"
        style={{ width: "100%", marginTop: 20 }}
      >
        Continuer
      </button>
    </section>
  );
});
