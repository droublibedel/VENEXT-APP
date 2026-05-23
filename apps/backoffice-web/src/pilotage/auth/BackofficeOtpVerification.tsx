"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

import { pilotageFrCi as t } from "../i18n/fr-ci";
import { useBackofficeAuth } from "./BackofficeAuthProvider";

function OtpForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const { verifyCode } = useBackofficeAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyCode(email, code.trim());
      router.replace("/pilotage");
    } catch {
      setError("Code invalide ou expiré.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bo-auth-wrap">
      <div className="bo-auth-card">
        <h1>{t.codeLabel}</h1>
        <p className="bo-muted">{email}</p>
        <form onSubmit={onSubmit} className="bo-form">
          <label>
            {t.codeLabel}
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoComplete="one-time-code"
            />
          </label>
          {error ? <p className="bo-error">{error}</p> : null}
          <button type="submit" disabled={busy || code.length !== 6}>
            {t.verify}
          </button>
        </form>
      </div>
    </div>
  );
}

export function BackofficeOtpVerification() {
  return (
    <Suspense fallback={<div className="bo-skeleton-auth" aria-hidden />}>
      <OtpForm />
    </Suspense>
  );
}
