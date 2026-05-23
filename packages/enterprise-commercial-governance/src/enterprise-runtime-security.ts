import type { EnterpriseGovernanceFlags } from "./enterprise-governance.types";
import {
  isEnterpriseNavigationLockEnabled,
  isEnterpriseRuntimeSecurityEnabled,
} from "./enterprise-governance.flags";
import {
  clearEnterpriseNavigationHistory,
  invalidateEnterpriseNavigation,
  releaseEnterpriseNavigationLock,
} from "./enterprise-navigation-lock";
import { revokeAllEnterpriseInvitations } from "./enterprise-invitation-governance";
import {
  invalidateAllSessionsForEnterprise,
  invalidateAllSessionsForUser,
} from "./enterprise-security-sessions";
import { listTrustedDevices } from "./enterprise-governance-storage";
import { enforceEnterpriseDeviceLimit, revokeEnterpriseDevice } from "./enterprise-trusted-device-governance";
import { resolveEnterpriseAccessState } from "./enterprise-access-state";
import { getEnterpriseSecurityTranslation } from "./enterprise-security-i18n";
import { runFullCommerceSessionCleanup } from "commerce-performance-foundation";

export type EnterpriseSecurityCleanupReason =
  | "suspend_user"
  | "archive_user"
  | "replace_user"
  | "suspend_enterprise"
  | "archive_enterprise"
  | "invalidate_session"
  | "revoke_access"
  | "revoke_device";

export type EnterpriseSecurityCleanupResult = {
  sessionsInvalidated: number;
  invitationsRevoked: number;
  devicesRevoked: number;
  navigationLocked: boolean;
  offlineInvalidated: boolean;
  commerceCleanupRan: boolean;
};

function runCommerceCleanup(organizationId: string, reason: EnterpriseSecurityCleanupReason): boolean {
  try {
    runFullCommerceSessionCleanup({
      organizationId,
      reason: reason as "logout",
      clearOffline: true,
    });
    return true;
  } catch {
    return false;
  }
}

/** Cleanup runtime complet après action critique (Instruction 20.86-D). */
export function runEnterpriseSecurityCleanup(input: {
  enterpriseId: string;
  internalEnterpriseUserId?: string;
  reason: EnterpriseSecurityCleanupReason;
  flags?: EnterpriseGovernanceFlags;
}): EnterpriseSecurityCleanupResult {
  const flags = input.flags ?? {};
  if (!isEnterpriseRuntimeSecurityEnabled(flags)) {
    return {
      sessionsInvalidated: 0,
      invitationsRevoked: 0,
      devicesRevoked: 0,
      navigationLocked: false,
      offlineInvalidated: false,
      commerceCleanupRan: false,
    };
  }

  let sessionsInvalidated = 0;
  if (input.internalEnterpriseUserId) {
    sessionsInvalidated = invalidateAllSessionsForUser(input.internalEnterpriseUserId);
  } else {
    sessionsInvalidated = invalidateAllSessionsForEnterprise(input.enterpriseId);
  }

  const invitationsRevoked = revokeAllEnterpriseInvitations(input.enterpriseId);

  let devicesRevoked = 0;
  const devices = listTrustedDevices(input.enterpriseId);
  for (const d of devices) {
    if (
      input.internalEnterpriseUserId &&
      d.internalEnterpriseUserId === input.internalEnterpriseUserId &&
      d.status === "APPROVED"
    ) {
      revokeEnterpriseDevice(d.id);
      devicesRevoked += 1;
    }
  }
  enforceEnterpriseDeviceLimit(input.enterpriseId);

  let navigationLocked = false;
  if (isEnterpriseNavigationLockEnabled(flags)) {
    invalidateEnterpriseNavigation(input.enterpriseId, input.reason);
    clearEnterpriseNavigationHistory(input.enterpriseId);
    navigationLocked = true;
  }

  const commerceCleanupRan = runCommerceCleanup(input.enterpriseId, input.reason);

  return {
    sessionsInvalidated,
    invitationsRevoked,
    devicesRevoked,
    navigationLocked,
    offlineInvalidated: commerceCleanupRan,
    commerceCleanupRan,
  };
}

/** Réactivation — pas de restauration session (Instruction 20.86-D). */
export function reactivateEnterpriseUserAccess(input: {
  enterpriseId: string;
  internalEnterpriseUserId: string;
  flags?: EnterpriseGovernanceFlags;
}): { requiresReauth: true; access: ReturnType<typeof resolveEnterpriseAccessState> } {
  releaseEnterpriseNavigationLock(input.enterpriseId);
  const access = resolveEnterpriseAccessState({
    enterpriseId: input.enterpriseId,
    internalEnterpriseUserId: input.internalEnterpriseUserId,
  });
  return { requiresReauth: true, access: { ...access, requiresReauth: true, canNavigate: true } };
}

export function getEnterpriseSuspendedHumanMessage(locale = "fr-CI"): string {
  return getEnterpriseSecurityTranslation("security.user.suspended.public", locale);
}

export function getEnterpriseConnectionVerificationMessage(locale = "fr-CI"): string {
  return getEnterpriseSecurityTranslation("security.connection.verify", locale);
}
