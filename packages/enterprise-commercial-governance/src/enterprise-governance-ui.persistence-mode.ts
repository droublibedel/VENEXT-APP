export type EnterpriseGovernanceDataSource = "LIVE" | "FALLBACK" | "HYBRID";

/** Mode UI : LIVE si core joignable, sinon fallback mémoire explicite (DEV/tests). */
function env(key: string): string | undefined {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env?.[key];
}

export function shouldForceEnterpriseGovernanceMemoryFallback(): boolean {
  if (env("ENTERPRISE_GOVERNANCE_UI_LIVE_TESTS") === "1") return false;
  if (env("ENTERPRISE_GOVERNANCE_UI_FORCE_FALLBACK") === "1") return true;
  if (env("NODE_ENV") === "test") return true;
  if (!env("CORE_DOMAIN_URL") && !env("NEXT_PUBLIC_CORE_DOMAIN_URL")) {
    return env("NODE_ENV") !== "production";
  }
  return false;
}

export function resolveEnterpriseGovernanceUiPreferredSource(): EnterpriseGovernanceDataSource {
  return shouldForceEnterpriseGovernanceMemoryFallback() ? "FALLBACK" : "LIVE";
}
