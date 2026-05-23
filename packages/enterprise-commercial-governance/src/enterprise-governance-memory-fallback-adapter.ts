/**
 * SEUL adaptateur autorisé à lire le store mémoire pour l'UI.
 * Les composants React ne doivent pas importer enterprise-governance-storage directement.
 */
import type {
  EnterpriseCollaboratorOnboarding,
  EnterpriseCommercialChannel,
  EnterpriseGovernanceHistoryEntry,
  EnterprisePoleActivation,
  EnterpriseSecureInvitation,
  EnterpriseSecurityAlert,
  EnterpriseTrustedDevice,
} from "./enterprise-governance.types";
import { listAllGovernanceHistory, listGovernanceHistory } from "./enterprise-governance-history";
import { listSecurityAlerts } from "./enterprise-security-alerts";
import {
  getEnterpriseChannel,
  listCollaboratorsByEnterprise,
  listEnterpriseChannels,
  listInvitationsForEnterprise,
  listPoleActivations,
  listTrustedDevices,
} from "./enterprise-governance-storage";

export function memoryFallbackChannels(): EnterpriseCommercialChannel[] {
  return listEnterpriseChannels();
}

export function memoryFallbackChannelDetail(enterpriseId: string): EnterpriseCommercialChannel | undefined {
  return getEnterpriseChannel(enterpriseId);
}

export function memoryFallbackPoleActivations(enterpriseId: string): EnterprisePoleActivation[] {
  return listPoleActivations(enterpriseId);
}

export function memoryFallbackInvitations(enterpriseId: string): EnterpriseSecureInvitation[] {
  return listInvitationsForEnterprise(enterpriseId);
}

export function memoryFallbackCollaborators(enterpriseId: string): EnterpriseCollaboratorOnboarding[] {
  return listCollaboratorsByEnterprise(enterpriseId);
}

export function memoryFallbackSecurityAlerts(enterpriseId: string): EnterpriseSecurityAlert[] {
  return listSecurityAlerts(enterpriseId);
}

export function memoryFallbackGovernanceHistory(enterpriseId: string): EnterpriseGovernanceHistoryEntry[] {
  return listGovernanceHistory(enterpriseId);
}

export function memoryFallbackAllGovernanceHistory(): EnterpriseGovernanceHistoryEntry[] {
  return listAllGovernanceHistory();
}

export function memoryFallbackTrustedDevices(enterpriseId: string): EnterpriseTrustedDevice[] {
  return listTrustedDevices(enterpriseId);
}
