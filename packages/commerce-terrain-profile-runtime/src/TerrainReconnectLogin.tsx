import { memo, useCallback, useState } from "react";

import {
  loginTerrainAccount,
  requestTerrainOtp,
  verifyTerrainOtp,
  type TerrainLoginActorRole,
} from "./terrain-login-api.js";

const DEV_MOCK_OTP = typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV;
const MOCK_OTP = "123456";

function toInternationalCiPhone(local: string): string {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith("225")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+225${digits}`;
  if (digits.length >= 8) return `+225${digits.replace(/^0/, "")}`;
  return local;
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length <= 2) return digits;
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function isValidLocalPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 10;
}

export const TerrainReconnectLogin = memo(function TerrainReconnectLogin({
  actorRole,
  onSuccess,
  onRegisterClick,
}: {
  actorRole: TerrainLoginActorRole;
  onSuccess: (result: { organizationId: string; profile: Record<string, unknown> }) => void;
  onRegisterClick?: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | undefined>();
  const [otpVerified, setOtpVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneOk = isValidLocalPhone(phone);

  const sendOtp = useCallback(async () => {
    if (!phoneOk || busy) return;
    setBusy(true);
    setError(null);
    const result = await requestTerrainOtp(toInternationalCiPhone(phone));
    setBusy(false);
    if (!result.ok) {
      setError(result.userMessage);
      return;
    }
    setOtpSent(true);
  }, [busy, phone, phoneOk]);

  const verifyOtp = useCallback(async () => {
    if (!phoneOk || otpVerified || busy) return;
    setBusy(true);
    setError(null);
    const result = await verifyTerrainOtp(toInternationalCiPhone(phone), otp.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.userMessage);
      return;
    }
    setOtpVerified(true);
    setRegistrationToken(result.registrationToken);
  }, [busy, otp, otpVerified, phone, phoneOk]);

  const connect = useCallback(async () => {
    if (!phoneOk || busy) return;
    setBusy(true);
    setError(null);
    let token = registrationToken;
    if (!token && /^\d{6}$/.test(otp.trim())) {
      const verified = await verifyTerrainOtp(toInternationalCiPhone(phone), otp.trim());
      if (!verified.ok) {
        setBusy(false);
        setError(verified.userMessage);
        return;
      }
      token = verified.registrationToken;
      setOtpVerified(true);
      setRegistrationToken(token);
    }
    if (!token && !otpVerified) {
      setBusy(false);
      setError("Vérifiez votre numéro avec le code SMS.");
      return;
    }
    const result = await loginTerrainAccount({
      phone: toInternationalCiPhone(phone),
      registrationToken: token,
      actorRole,
      devBypassOtp: DEV_MOCK_OTP && otpVerified && !token,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.userMessage);
      return;
    }
    onSuccess({ organizationId: result.organizationId, profile: result.profile });
  }, [actorRole, busy, onSuccess, otp, otpVerified, phone, phoneOk, registrationToken]);

  const simulateDevOtp = useCallback(() => {
    setOtp(MOCK_OTP);
    setOtpVerified(true);
  }, []);

  return (
    <section data-testid="terrain-reconnect-login">
      <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Connexion</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--venext-text-muted, #5c6660)" }}>
        Entrez votre numéro pour retrouver votre compte terrain.
      </p>
      {error ? (
        <p role="alert" data-testid="terrain-reconnect-error" style={{ color: "#b42318", fontSize: 13, marginBottom: 12 }}>
          {error}
        </p>
      ) : null}
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--venext-text-muted, #5c6660)" }}>Numéro de téléphone</span>
        <input
          type="tel"
          inputMode="numeric"
          value={formatPhoneDisplay(phone)}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          style={{ width: "100%", minHeight: 44, marginTop: 4, padding: "0 12px", borderRadius: 10, border: "1px solid var(--venext-border, #e4e8e6)" }}
          data-testid="terrain-reconnect-phone"
        />
      </label>
      {!otpVerified ? (
        <>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "var(--venext-text-muted, #5c6660)" }}>Code SMS</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={{ width: "100%", minHeight: 44, marginTop: 4, padding: "0 12px", borderRadius: 10, border: "1px solid var(--venext-border, #e4e8e6)" }}
              data-testid="terrain-reconnect-otp"
            />
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            <button type="button" disabled={!phoneOk || busy} onClick={() => void sendOtp()} style={{ minHeight: 44, borderRadius: 10, border: "1px solid var(--venext-border, #e4e8e6)", background: "#fff" }}>
              {otpSent ? "Renvoyer le code" : "Recevoir le code"}
            </button>
            {DEV_MOCK_OTP ? (
              <button type="button" data-testid="terrain-reconnect-otp-auto" onClick={simulateDevOtp} style={{ minHeight: 40, fontSize: 12 }}>
                Code dev : {MOCK_OTP}
              </button>
            ) : null}
            <button type="button" disabled={!phoneOk || otp.length !== 6 || busy} onClick={() => void verifyOtp()} style={{ minHeight: 44, borderRadius: 10, border: "none", background: "var(--venext-accent-soft, #e8f5f0)", fontWeight: 600 }}>
              Vérifier le code
            </button>
          </div>
        </>
      ) : null}
      <button
        type="button"
        data-testid="terrain-reconnect-submit"
        disabled={!phoneOk || busy || (!otpVerified && otp.length !== 6)}
        onClick={() => void connect()}
        style={{
          width: "100%",
          minHeight: 44,
          borderRadius: 12,
          border: "none",
          background: "var(--venext-accent, #00a884)",
          color: "#fff",
          fontWeight: 600,
          opacity: phoneOk ? 1 : 0.5,
        }}
      >
        {busy ? "Connexion…" : "Se connecter"}
      </button>
      {onRegisterClick ? (
        <button
          type="button"
          data-testid="terrain-reconnect-to-register"
          onClick={onRegisterClick}
          style={{ width: "100%", minHeight: 40, marginTop: 12, border: "none", background: "transparent", color: "var(--venext-accent, #00a884)", fontWeight: 600 }}
        >
          Pas encore inscrit ? Créer un compte
        </button>
      ) : null}
    </section>
  );
});
