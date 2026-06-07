import { memo, useCallback, useState } from "react";

import { requestGrossisteBOtp, verifyGrossisteBOtp, isValidOtpInput } from "./grossiste-b-otp-api";
import {
  formatLocalCiPhoneDisplay,
  sanitizeLocalCiPhoneInput,
} from "./grossiste-b-phone";
import { MOCK_OTP_CODE, validateGrossisteBPhone } from "./grossiste-b-onboarding.viewmodel";

const DEV_MOCK_OTP = import.meta.env.DEV;

export const GrossisteBPhoneStep = memo(function GrossisteBPhoneStep({
  phone,
  otpVerified,
  onPhoneChange,
  onOtpVerified,
  onNext,
}: {
  phone: string;
  otpVerified: boolean;
  onPhoneChange: (v: string) => void;
  onOtpVerified: (registrationToken?: string) => void;
  onNext: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinationHint, setDestinationHint] = useState<string | null>(null);

  const phoneOk = validateGrossisteBPhone(phone);
  const otpOk = otpVerified || isValidOtpInput(otp);

  const sendOtp = useCallback(async () => {
    if (!phoneOk || busy) return;
    setBusy(true);
    setError(null);
    const result = await requestGrossisteBOtp(phone);
    setBusy(false);
    if (!result.ok) {
      setError(result.userMessage);
      return;
    }
    setOtpSent(true);
    setDestinationHint(result.destinationHint);
  }, [busy, phone, phoneOk]);

  const verifyOtp = useCallback(async () => {
    if (!phoneOk || !isValidOtpInput(otp) || busy || otpVerified) return;
    setBusy(true);
    setError(null);
    const result = await verifyGrossisteBOtp(phone, otp);
    setBusy(false);
    if (!result.ok) {
      setError(result.userMessage);
      return;
    }
    onOtpVerified(result.registrationToken);
  }, [busy, onOtpVerified, otp, otpVerified, phone, phoneOk]);

  const simulateDevOtp = useCallback(() => {
    setOtp(MOCK_OTP_CODE);
    onOtpVerified(undefined);
  }, [onOtpVerified]);

  return (
    <section data-testid="gb-onboarding-phone">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Votre numéro</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--venext-text-muted)" }}>
        Saisissez votre numéro mobile ivoirien (10 chiffres).
      </p>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--venext-text-muted)" }}>Numéro de téléphone</span>
        <input
          className="grossiste-b-search"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={formatLocalCiPhoneDisplay(phone)}
          onChange={(e) => {
            onPhoneChange(sanitizeLocalCiPhoneInput(e.target.value));
            setOtpSent(false);
            setDestinationHint(null);
            setError(null);
          }}
          placeholder="07 00 00 00 00"
          maxLength={14}
          data-testid="gb-onboarding-phone-input"
        />
      </label>

      {phoneOk && !otpVerified ? (
        <>
          {!otpSent ? (
            <button
              type="button"
              className="grossiste-b-action grossiste-b-action--primary"
              disabled={busy}
              onClick={() => void sendOtp()}
              data-testid="gb-onboarding-send-otp"
              style={{ width: "100%", marginBottom: 12 }}
            >
              {busy ? "Envoi…" : "Recevoir le code par SMS"}
            </button>
          ) : (
            <>
              {destinationHint ? (
                <p style={{ fontSize: 12, color: "var(--venext-text-muted)", margin: "0 0 8px" }}>
                  Code envoyé au {destinationHint}
                </p>
              ) : null}
              <label style={{ display: "block", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--venext-text-muted)" }}>Code reçu par SMS</span>
                <input
                  className="grossiste-b-search"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 chiffres"
                  data-testid="gb-onboarding-otp-input"
                />
              </label>
              <button
                type="button"
                className="grossiste-b-action grossiste-b-action--primary"
                disabled={busy || !isValidOtpInput(otp)}
                onClick={() => void verifyOtp()}
                data-testid="gb-onboarding-verify-otp"
                style={{ width: "100%", marginBottom: 8 }}
              >
                {busy ? "Vérification…" : "Vérifier le code"}
              </button>
              <button
                type="button"
                className="grossiste-b-action"
                disabled={busy}
                onClick={() => void sendOtp()}
                data-testid="gb-onboarding-resend-otp"
                style={{ width: "100%", marginBottom: 12 }}
              >
                Renvoyer le code
              </button>
            </>
          )}

          {DEV_MOCK_OTP ? (
            <button
              type="button"
              className="grossiste-b-action"
              onClick={simulateDevOtp}
              data-testid="gb-onboarding-otp-auto"
              style={{ width: "100%", marginBottom: 12 }}
            >
              Mode démo — simuler OTP validé
            </button>
          ) : null}
        </>
      ) : null}

      {error ? (
        <p role="alert" style={{ color: "var(--venext-danger, #b42318)", fontSize: 13, marginBottom: 12 }}>
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className="grossiste-b-action grossiste-b-action--primary"
        disabled={!phoneOk || !otpOk}
        onClick={onNext}
        data-testid="gb-onboarding-phone-next"
        style={{ width: "100%" }}
      >
        Continuer
      </button>
    </section>
  );
});
