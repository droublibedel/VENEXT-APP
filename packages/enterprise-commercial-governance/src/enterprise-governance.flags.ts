import type { EnterpriseGovernanceFlags } from "./enterprise-governance.types";

export function isEnterpriseGovernanceEnabled(flags: EnterpriseGovernanceFlags = {}): boolean {
  return flags.enterprise_governance_enabled !== false;
}

export function isEnterpriseSecureChannelsEnabled(flags: EnterpriseGovernanceFlags = {}): boolean {
  return (
    isEnterpriseGovernanceEnabled(flags) && flags.enterprise_secure_channels_enabled !== false
  );
}

export function isEnterpriseControlledOnboardingEnabled(
  flags: EnterpriseGovernanceFlags = {},
): boolean {
  return (
    isEnterpriseGovernanceEnabled(flags) && flags.enterprise_controlled_onboarding_enabled !== false
  );
}

export function isEnterpriseSecurityGovernanceEnabled(flags: EnterpriseGovernanceFlags = {}): boolean {
  return (
    isEnterpriseGovernanceEnabled(flags) && flags.enterprise_security_governance_enabled !== false
  );
}

export function isEnterpriseArchiveWorkflowEnabled(flags: EnterpriseGovernanceFlags = {}): boolean {
  return (
    isEnterpriseSecurityGovernanceEnabled(flags) && flags.enterprise_archive_workflow_enabled !== false
  );
}

export function isEnterpriseInternalSecurityEnabled(flags: EnterpriseGovernanceFlags = {}): boolean {
  return (
    isEnterpriseSecurityGovernanceEnabled(flags) && flags.enterprise_internal_security_enabled !== false
  );
}

export function isEnterpriseRuntimeSecurityEnabled(flags: EnterpriseGovernanceFlags = {}): boolean {
  return (
    isEnterpriseSecurityGovernanceEnabled(flags) && flags.enterprise_runtime_security_enabled !== false
  );
}

export function isEnterpriseInvitationRevocationEnabled(flags: EnterpriseGovernanceFlags = {}): boolean {
  return (
    isEnterpriseRuntimeSecurityEnabled(flags) && flags.enterprise_invitation_revocation_enabled !== false
  );
}

export function isEnterpriseNavigationLockEnabled(flags: EnterpriseGovernanceFlags = {}): boolean {
  return (
    isEnterpriseRuntimeSecurityEnabled(flags) && flags.enterprise_navigation_lock_enabled !== false
  );
}

export function isEnterpriseAppendOnlyHistoryEnabled(flags: EnterpriseGovernanceFlags = {}): boolean {
  return flags.enterprise_append_only_history_enabled !== false;
}
