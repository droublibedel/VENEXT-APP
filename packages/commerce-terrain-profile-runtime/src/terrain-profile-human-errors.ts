const SWITCH_ERROR_MESSAGES: Record<string, string> = {
  invalid_user: "Identifiant utilisateur invalide. Reconnectez-vous.",
  identity_not_found: "Profil terrain introuvable. Réessayez dans un instant.",
  invalid_profile: "Profil inconnu.",
  profile_switch_offline_not_allowed: "Changement de profil indisponible hors ligne.",
  profile_switch_failed: "Impossible de changer de profil. Réessayez.",
  profile_resource_mismatch: "Impossible de changer de profil. Réessayez.",
  stale_profile_session: "Session expirée. Rechargez l'application.",
  bff_unavailable: "Serveur indisponible. Démarrez commerce-bff (port 3210) puis réessayez.",
  terrain_switch_failed_502: "Serveur indisponible. Vérifiez que commerce-bff tourne sur le port 3210.",
  terrain_switch_failed_503: "Serveur indisponible. Vérifiez que commerce-bff tourne sur le port 3210.",
};

export function humanizeTerrainProfileSwitchError(code: string | null): string | null {
  if (!code) return null;
  if (code.includes("Failed to fetch") || code.includes("NetworkError") || code.includes("ECONNREFUSED")) {
    return SWITCH_ERROR_MESSAGES.bff_unavailable;
  }
  if (code.startsWith("terrain_switch_failed_")) {
    return SWITCH_ERROR_MESSAGES.bff_unavailable;
  }
  return SWITCH_ERROR_MESSAGES[code] ?? "Impossible de changer de profil. Réessayez.";
}
