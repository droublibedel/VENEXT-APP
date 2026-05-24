import { memo, useCallback, useState } from "react";

import type { WalletIdentityDocument, WalletSecurityPin } from "./venext-wallet-security.types";
import { nextWalletActivationStep, validateWalletIdentityDocument } from "./venext-wallet-security-kyc";
import type { WalletActivationStep } from "./venext-wallet-security.types";
import { useVenextWalletSecurity } from "./venext-wallet-security-context";
import { completeWalletActivation } from "./venext-wallet-security-session";

export type WalletBceaoActivationFlowProps = {
  onComplete?: () => void;
  testId?: string;
};

export const WalletBceaoActivationFlow = memo(function WalletBceaoActivationFlow({
  onComplete,
  testId = "wallet-bceao-activation",
}: WalletBceaoActivationFlowProps) {
  const security = useVenextWalletSecurity();
  const [step, setStep] = useState<WalletActivationStep>("activation");
  const [identity, setIdentity] = useState<Partial<WalletIdentityDocument>>({
    photoQuality: "missing",
  });
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const advance = useCallback(
    (next?: WalletActivationStep) => {
      setError(null);
      setStep(next ?? nextWalletActivationStep(step));
    },
    [step],
  );

  const submitIdentity = useCallback(() => {
    const check = validateWalletIdentityDocument(identity);
    if (!check.valid) {
      setError(check.message ?? "Informations incomplètes.");
      return;
    }
    advance("document");
  }, [identity, advance]);

  const submitDocument = useCallback(() => {
    const check = validateWalletIdentityDocument({ ...identity, photoQuality: "ok" });
    if (!check.valid) {
      setError(check.message ?? "Photo requise.");
      return;
    }
    advance("pin");
  }, [identity, advance]);

  const submitPin = useCallback(() => {
    if (pin !== pinConfirm) {
      setError("Les deux codes doivent être identiques.");
      return;
    }
    const result = security.setPin(pin as WalletSecurityPin);
    if (!result.ok) {
      setError("Le code doit contenir exactement 4 chiffres.");
      return;
    }
    advance("biometric");
  }, [pin, pinConfirm, security, advance]);

  const finishActivation = useCallback(() => {
    completeWalletActivation();
    advance("done");
    onComplete?.();
  }, [advance, onComplete]);

  const skipBiometric = useCallback(() => {
    finishActivation();
  }, [finishActivation]);

  const enableBiometric = useCallback(() => {
    const result = security.enableBiometric();
    if (!result.enabled) {
      setError(result.message ?? "Biométrie indisponible.");
      return;
    }
    finishActivation();
  }, [security, finishActivation]);

  return (
    <section data-testid={testId} style={{ padding: 16, maxWidth: 420 }}>
      <p style={{ fontSize: 11, color: "#00a884", margin: "0 0 12px" }}>
        Activation wallet — conformité BCEAO
      </p>

      {step === "activation" ? (
        <>
          <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Activer les règlements</h2>
          <p style={{ fontSize: 14, color: "#526059", margin: "0 0 16px" }}>
            Vos commandes et messages restent accessibles. L&apos;identité n&apos;est demandée que pour
            recevoir ou payer via wallet.
          </p>
          <button type="button" data-testid="wallet-activation-start" onClick={() => advance("identity")}>
            Commencer
          </button>
        </>
      ) : null}

      {step === "identity" ? (
        <>
          <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Votre identité</h2>
          <label style={{ display: "block", marginBottom: 8 }}>
            Prénom
            <input
              value={identity.firstName ?? ""}
              onChange={(e) => setIdentity((p) => ({ ...p, firstName: e.target.value }))}
              data-testid="wallet-kyc-firstname"
            />
          </label>
          <label style={{ display: "block", marginBottom: 8 }}>
            Nom
            <input
              value={identity.lastName ?? ""}
              onChange={(e) => setIdentity((p) => ({ ...p, lastName: e.target.value }))}
              data-testid="wallet-kyc-lastname"
            />
          </label>
          <label style={{ display: "block", marginBottom: 12 }}>
            Date de naissance
            <input
              type="date"
              value={identity.birthDate ?? ""}
              onChange={(e) => setIdentity((p) => ({ ...p, birthDate: e.target.value }))}
              data-testid="wallet-kyc-birthdate"
            />
          </label>
          <button type="button" onClick={submitIdentity}>
            Continuer
          </button>
        </>
      ) : null}

      {step === "document" ? (
        <>
          <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Pièce d&apos;identité</h2>
          <select
            value={identity.documentType ?? "CNI"}
            onChange={(e) =>
              setIdentity((p) => ({
                ...p,
                documentType: e.target.value as WalletIdentityDocument["documentType"],
              }))
            }
            data-testid="wallet-kyc-doc-type"
          >
            <option value="CNI">CNI</option>
            <option value="PASSEPORT">Passeport</option>
            <option value="PERMIS">Permis</option>
            <option value="CARTE_CONSULAIRE">Carte consulaire</option>
          </select>
          <label style={{ display: "block", margin: "12px 0" }}>
            Numéro
            <input
              value={identity.documentNumber ?? ""}
              onChange={(e) => setIdentity((p) => ({ ...p, documentNumber: e.target.value }))}
              data-testid="wallet-kyc-doc-number"
            />
          </label>
          <button type="button" onClick={() => setIdentity((p) => ({ ...p, photoQuality: "ok" }))}>
            Photo ajoutée (démo)
          </button>
          <button type="button" style={{ marginLeft: 8 }} onClick={submitDocument}>
            Valider la pièce
          </button>
        </>
      ) : null}

      {step === "pin" ? (
        <>
          <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Code wallet (4 chiffres)</h2>
          <input
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            data-testid="wallet-pin"
            placeholder="••••"
          />
          <input
            inputMode="numeric"
            maxLength={4}
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
            data-testid="wallet-pin-confirm"
            placeholder="Confirmer"
            style={{ marginLeft: 8 }}
          />
          <button type="button" style={{ display: "block", marginTop: 12 }} onClick={submitPin}>
            Enregistrer le code
          </button>
        </>
      ) : null}

      {step === "biometric" ? (
        <>
          <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>Déverrouillage rapide (optionnel)</h2>
          <p style={{ fontSize: 14, color: "#526059" }}>
            Empreinte ou reconnaissance faciale — vous pouvez passer cette étape.
          </p>
          <button type="button" data-testid="wallet-biometric-enable" onClick={enableBiometric}>
            Activer biométrie
          </button>
          <button type="button" style={{ marginLeft: 8 }} onClick={skipBiometric}>
            Plus tard
          </button>
        </>
      ) : null}

      {error ? (
        <p role="alert" data-testid="wallet-activation-error" style={{ color: "#e8a090", marginTop: 12 }}>
          {error}
        </p>
      ) : null}
    </section>
  );
});
