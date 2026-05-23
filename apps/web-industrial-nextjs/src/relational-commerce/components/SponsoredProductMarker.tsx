"use client";

type Props = {
  variant?: "in_relationship" | "discovery";
  className?: string;
};

/**
 * Sponsored must never masquerade as a partner lane (Instruction 9 §10–11).
 */
export function SponsoredProductMarker({ variant = "discovery", className = "" }: Props) {
  const label =
    variant === "in_relationship"
      ? "SPONSORISÉ (contexte relation)"
      : "SPONSORISÉ — découverte contrôlée";
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100 ${className}`}
      title="Pas de comparaison de prix ni de classement fournisseur."
    >
      {label}
    </span>
  );
}
