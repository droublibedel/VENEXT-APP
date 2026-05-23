import { memo } from "react";

export const GrossisteBIdentityStep = memo(function GrossisteBIdentityStep({
  displayName,
  businessName,
  onDisplayNameChange,
  onBusinessNameChange,
  onNext,
}: {
  displayName: string;
  businessName: string;
  onDisplayNameChange: (v: string) => void;
  onBusinessNameChange: (v: string) => void;
  onNext: () => void;
}) {
  const canContinue = displayName.trim().length >= 2;

  return (
    <section data-testid="gb-onboarding-identity">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Votre identité</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#8fa39a" }}>
        Un seul nom — comme sur WhatsApp. Pas de fiche entreprise.
      </p>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "#8fa39a" }}>Nom, prénom ou pseudonyme</span>
        <input
          className="grossiste-b-search"
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Ex. Moussa, Sarah grossiste…"
          data-testid="gb-onboarding-display-name"
          autoComplete="nickname"
        />
      </label>
      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "#8fa39a" }}>Nom boutique (optionnel)</span>
        <input
          className="grossiste-b-search"
          type="text"
          value={businessName}
          onChange={(e) => onBusinessNameChange(e.target.value)}
          placeholder="Ex. La Rue de la Mode"
          data-testid="gb-onboarding-business-name"
        />
      </label>
      <p style={{ fontSize: 11, color: "#6b7f76", margin: "0 0 12px" }}>
        Photo et logo non requis — votre réseau vous reconnaît par votre nom.
      </p>
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
