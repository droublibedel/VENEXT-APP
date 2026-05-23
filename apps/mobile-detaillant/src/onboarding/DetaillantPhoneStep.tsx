import { memo, useState } from "react";

import { MOCK_OTP_CODE, validateDetaillantOtp, validateDetaillantPhone } from "./detaillant-onboarding.viewmodel";

export const DetaillantPhoneStep = memo(function DetaillantPhoneStep({
  phone,
  otpVerified,
  onPhoneChange,
  onOtpVerified,
  onNext,
}: {
  phone: string;
  otpVerified: boolean;
  onPhoneChange: (v: string) => void;
  onOtpVerified: () => void;
  onNext: () => void;
}) {
  const [otp, setOtp] = useState("");
  const phoneOk = validateDetaillantPhone(phone);
  const otpOk = validateDetaillantOtp(otp) || otpVerified;

  return (
    <section data-testid="dt-onboarding-phone">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Votre numéro</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#8fa39a" }}>
        Téléphone-first — comme WhatsApp.
      </p>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "#8fa39a" }}>Numéro de téléphone</span>
        <input
          className="detaillant-search"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+225 07 00 00 00 00"
          data-testid="dt-onboarding-phone-input"
        />
      </label>
      {phoneOk ? (
        <>
          <label style={{ display: "block", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#8fa39a" }}>Code reçu par SMS</span>
            <input
              className="detaillant-search"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 chiffres"
              data-testid="dt-onboarding-otp-input"
            />
          </label>
          <button
            type="button"
            className="detaillant-action"
            onClick={() => {
              setOtp(MOCK_OTP_CODE);
              onOtpVerified();
            }}
            data-testid="dt-onboarding-otp-auto"
            style={{ width: "100%", marginBottom: 12 }}
          >
            Simuler lecture OTP automatique
          </button>
        </>
      ) : null}
      <button
        type="button"
        className="detaillant-action detaillant-action--primary"
        disabled={!phoneOk || !otpOk}
        onClick={onNext}
        data-testid="dt-onboarding-phone-next"
        style={{ width: "100%" }}
      >
        Continuer
      </button>
    </section>
  );
});
