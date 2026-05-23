/**
 * Instruction 20.78-A — pont léger vers venext-auth-foundation (côté app).
 * Évite une dépendance circulaire : les apps importent parseWalletBalanceFcfa
 * depuis venext-auth-foundation et passent balanceFcfa aux providers.
 */
export function parseBalanceLabelToFcfa(label: string | number | undefined | null): number {
  if (typeof label === "number" && Number.isFinite(label)) return Math.max(0, label);
  if (!label) return 0;
  const digits = String(label).replace(/\D/g, "");
  return digits ? Number.parseInt(digits, 10) || 0 : 0;
}

export const BCEAO_TERRAIN_SECURED_THRESHOLD_FCFA = 1000;
