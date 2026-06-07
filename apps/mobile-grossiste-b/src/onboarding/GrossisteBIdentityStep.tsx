import { memo } from "react";

export const GrossisteBIdentityStep = memo(function GrossisteBIdentityStep({
  displayName,
  onDisplayNameChange,
  onNext,
}: {
  displayName: string;
  onDisplayNameChange: (v: string) => void;
  onNext: () => void;
}) {
  const canContinue = displayName.trim().length >= 2;

  return (
    <section data-testid="gb-onboarding-identity">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Votre identité</h2>
      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "var(--venext-text-muted)" }}>Nom, prénom ou pseudonyme</span>
        <input
          className="grossiste-b-search"
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Ex. Moussa, Sarah…"
          data-testid="gb-onboarding-display-name"
          autoComplete="nickname"
        />
      </label>
      <button
        type="button"
        className="grossiste-b-action grossiste-b-action--primary"
        disabled={!canContinue}
        onClick={onNext}
        data-testid="gb-onboarding-identity-next"
        style={{ width: "100%" }}
      >
        Continuer
      </button>
    </section>
  );
});
