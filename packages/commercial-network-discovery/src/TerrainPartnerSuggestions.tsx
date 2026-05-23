import { memo } from "react";

import { CommercialContactSuggestions } from "./CommercialContactSuggestions";
import type { CommercialContactSuggestion } from "./commercial-network-discovery.types";

const ROLE_LABELS: Record<string, string> = {
  grossiste: "Grossiste",
  grossiste_b: "Grossiste",
  grossiste_a: "Grossiste",
  producteur: "Producteur",
  detaillant: "Détaillant",
};

function resolvePartnerRoleLabel(s: CommercialContactSuggestion): string {
  const act = (s.activityLabel ?? "").toLowerCase();
  if (act.includes("producteur")) return ROLE_LABELS.producteur!;
  if (act.includes("grossiste")) return ROLE_LABELS.grossiste!;
  if (act.includes("détaillant") || act.includes("detaillant")) return ROLE_LABELS.detaillant!;
  return s.activityLabel || "Partenaire";
}

/** Suggestions partenaires — homepage jamais vide (GROSSISTE-B-02). */
export const TerrainPartnerSuggestions = memo(function TerrainPartnerSuggestions({
  suggestions,
  syncGranted,
  autoAccept,
  onInvite,
  fallbackSuggestions,
}: {
  suggestions: CommercialContactSuggestion[];
  syncGranted: boolean;
  autoAccept: boolean;
  onInvite: (id: string) => void;
  /** Affiché si liste vide — évite écran vide */
  fallbackSuggestions?: CommercialContactSuggestion[];
}) {
  const list = suggestions.length ? suggestions : (fallbackSuggestions ?? []);

  if (!list.length) {
    return (
      <section data-testid="terrain-partner-suggestions-empty">
        <p style={{ fontSize: 13, color: "#8fa39a" }}>
          Découvrez des grossistes, détaillants et producteurs près de vous.
        </p>
      </section>
    );
  }

  return (
    <section data-testid="terrain-partner-suggestions">
      <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>Suggestions partenaires</h2>
      <p style={{ fontSize: 11, color: "#6b8078", margin: "0 0 12px" }}>
        Grossistes · Détaillants · Producteurs selon contacts, ville et proximité réseau
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
        {list.slice(0, 6).map((s) => (
          <li
            key={s.id}
            data-testid={`terrain-partner-role-${s.id}`}
            style={{ fontSize: 10, color: "#8fa39a", marginBottom: 4 }}
          >
            {resolvePartnerRoleLabel(s)}
          </li>
        ))}
      </ul>
      <CommercialContactSuggestions
        suggestions={list}
        syncGranted={syncGranted}
        autoAccept={autoAccept}
        onConnect={onInvite}
      />
    </section>
  );
});
