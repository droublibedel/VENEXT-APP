"use client";

import { useState } from "react";

import { pilotageFrCi as t } from "../i18n/fr-ci";
import { useBackofficeAuth } from "./BackofficeAuthProvider";

export function BackofficeLoginScreen() {
  const { requestCode } = useBackofficeAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await requestCode(email.trim());
      window.location.href = `/pilotage/login/otp?email=${encodeURIComponent(email.trim())}`;
    } catch {
      setError("Email non autorisé ou service indisponible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bo-auth-wrap">
      <div className="bo-auth-card">
        <h1>{t.loginTitle}</h1>
        <p className="bo-muted">{t.loginSubtitle}</p>
        <form onSubmit={onSubmit} className="bo-form">
          <label>
            {t.emailLabel}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@venext.ci"
              required
              autoComplete="username"
            />
          </label>
          {error ? <p className="bo-error">{error}</p> : null}
          <button type="submit" disabled={busy}>
            {t.sendCode}
          </button>
        </form>
      </div>
    </div>
  );
}
