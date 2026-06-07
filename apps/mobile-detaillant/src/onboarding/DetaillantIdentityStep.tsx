import { memo } from "react";

export const DetaillantIdentityStep = memo(function DetaillantIdentityStep({
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
    <section data-testid="dt-onboarding-identity">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Votre identité</h2>
      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "var(--venext-text-muted)" }}>Nom, prénom ou pseudonyme</span>
        <input
          className="detaillant-search"
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Ex. Aminata, François…"
          data-testid="dt-onboarding-display-name"
          autoComplete="nickname"
        />
      </label>
      <button
        type="button"
        className="detaillant-action detaillant-action--primary"
        disabled={!canContinue}
        onClick={onNext}
        data-testid="dt-onboarding-identity-next"
        style={{ width: "100%" }}
      >
        Continuer
      </button>
    </section>
  );
});
