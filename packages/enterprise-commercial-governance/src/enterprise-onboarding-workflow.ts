import type { EnterpriseOnboardingStepId } from "./enterprise-governance.types";

export const ENTERPRISE_ONBOARDING_STEPS: {
  id: EnterpriseOnboardingStepId;
  label: string;
}[] = [
  { id: "commercial_meeting", label: "Rencontre / validation commerciale" },
  { id: "contract_signed", label: "Signature contrat" },
  { id: "contract_scan", label: "Scan contrat" },
  { id: "channel_open", label: "Ouverture canal entreprise" },
  { id: "enterprise_dossier", label: "Dossier entreprise" },
  { id: "poles_activation", label: "Activation pôles VENEXT existants" },
  { id: "secure_links", label: "Liens sécurisés responsables" },
  { id: "collaborator_registration", label: "Inscription collaborateurs" },
  { id: "human_validation", label: "Validation humaine VENEXT" },
  { id: "platform_activation", label: "Activation accès plateforme" },
];

export function computeOnboardingProgress(completedStepIds: EnterpriseOnboardingStepId[]): number {
  if (ENTERPRISE_ONBOARDING_STEPS.length === 0) return 0;
  const set = new Set(completedStepIds);
  const done = ENTERPRISE_ONBOARDING_STEPS.filter((s) => set.has(s.id)).length;
  return Math.round((done / ENTERPRISE_ONBOARDING_STEPS.length) * 100);
}

export function generateInternalEnterpriseUserId(enterpriseId: string): string {
  const suffix = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `ieu-${enterpriseId.slice(0, 12)}-${suffix}`;
}
