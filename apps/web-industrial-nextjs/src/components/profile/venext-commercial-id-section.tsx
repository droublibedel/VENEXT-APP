"use client";

import { useCallback, useState } from "react";

export type VenextCommercialIdSectionProps = {
  commercialId: string;
  /** UI language for the field label */
  locale?: "en" | "fr";
};

/**
 * Profile row: public commercial identifier + copy (web clipboard).
 * Contract: copy control must expose `data-testid="venext-commercial-id-copy"`.
 */
export function VenextCommercialIdSection({
  commercialId,
  locale = "en",
}: VenextCommercialIdSectionProps) {
  const [copied, setCopied] = useState(false);
  const label =
    locale === "fr" ? "Identifiant VENEXT" : "VENEXT ID";

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(commercialId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [commercialId]);

  return (
    <section
      className="rounded-lg border border-vx-ink/10 bg-vx-surface px-4 py-3"
      aria-label={label}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-vx-signal">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="font-mono text-lg tracking-wide text-vx-ink">
          {commercialId}
        </span>
        <button
          type="button"
          data-testid="venext-commercial-id-copy"
          onClick={() => void copy()}
          className="rounded-md border border-vx-ink/15 bg-vx-ink/5 px-2 py-1 text-xs font-medium text-vx-ink hover:bg-vx-ink/10"
        >
          {copied ? (locale === "fr" ? "Copié" : "Copied") : locale === "fr" ? "Copier" : "Copy"}
        </button>
      </div>
    </section>
  );
}
