import type {
  EnterpriseCollaboratorOnboarding,
  EnterpriseSecurityActionType,
  GovernanceActionNote,
  GovernanceLevel,
} from "./enterprise-governance.types";
import { archiveInsteadOfDelete, preventHardDelete } from "./enterprise-delete-guard";
import { appendGovernanceHistory } from "./enterprise-governance-history";
import {
  getCollaborator,
  getEnterpriseChannel,
  getTrustedDevice,
  listTrustedDevices,
  listTrustedIps,
  registerCollaboratorOnboarding,
  updateCollaborator,
  updateEnterpriseChannel,
} from "./enterprise-governance-storage";
import { detectSecurityAlerts } from "./enterprise-security-alerts";
import { approveTrustedDevice, revokeTrustedDevice } from "./enterprise-trusted-device";
import {
  invalidateAllSessionsForEnterprise,
  invalidateAllSessionsForUser,
  invalidateSession,
} from "./enterprise-security-sessions";
import { getEnterpriseSecurityTranslation } from "./enterprise-security-i18n";
import { runEnterpriseSecurityCleanup } from "./enterprise-runtime-security";
import { revokeActivationLinkCascade } from "./enterprise-activation-link-hierarchy";
import { revokeAllEnterpriseInvitations } from "./enterprise-invitation-governance";
import { revokeEnterpriseDevice } from "./enterprise-trusted-device-governance";
import { reactivateEnterpriseUserAccess } from "./enterprise-runtime-security";

const notes: GovernanceActionNote[] = [];

export class GovernanceNoteRequiredError extends Error {
  constructor() {
    super("GOVERNANCE_NOTE_REQUIRED");
    this.name = "GovernanceNoteRequiredError";
  }
}

export class GovernanceLevelForbiddenError extends Error {
  constructor(action: EnterpriseSecurityActionType, level: GovernanceLevel) {
    super(`GOVERNANCE_LEVEL_FORBIDDEN:${action}:${level}`);
    this.name = "GovernanceLevelForbiddenError";
  }
}

const VENEXT_ONLY_ACTIONS: EnterpriseSecurityActionType[] = [
  "ARCHIVE_ENTERPRISE",
  "REACTIVATE_ENTERPRISE",
];

export function assertGovernanceNote(reason: string): void {
  if (!reason || reason.trim().length < 8) {
    throw new GovernanceNoteRequiredError();
  }
}

export function createGovernanceActionNote(input: Omit<GovernanceActionNote, "id" | "createdAt">): GovernanceActionNote {
  assertGovernanceNote(input.reason);
  const note: GovernanceActionNote = {
    ...input,
    id: `gan-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  return note;
}

export function listGovernanceActionNotes(enterpriseId?: string): GovernanceActionNote[] {
  if (!enterpriseId) return [...notes];
  return notes.filter((n) => n.target.includes(enterpriseId) || n.author.includes(enterpriseId));
}

export function assertPartnerCannotExecuteGlobalAction(
  action: EnterpriseSecurityActionType,
  level: GovernanceLevel,
): void {
  if (level === "PARTNER_SECURITY" && VENEXT_ONLY_ACTIONS.includes(action)) {
    throw new GovernanceLevelForbiddenError(action, level);
  }
}

export function getSuspendedUserPublicMessage(locale = "fr-CI"): string {
  return getEnterpriseSecurityTranslation("security.user.suspended.public", locale);
}

export function suspendEnterpriseUser(input: {
  internalEnterpriseUserId: string;
  enterpriseId: string;
  author: string;
  authorLevel: GovernanceLevel;
  reason: string;
  optionalDocument?: string;
}): EnterpriseCollaboratorOnboarding {
  assertPartnerCannotExecuteGlobalAction("SUSPEND_USER", input.authorLevel);
  assertGovernanceNote(input.reason);
  const row = getCollaborator(input.internalEnterpriseUserId);
  if (!row) throw new Error("COLLABORATOR_NOT_FOUND");

  createGovernanceActionNote({
    actionType: "SUSPEND_USER",
    author: input.author,
    authorLevel: input.authorLevel,
    target: input.internalEnterpriseUserId,
    reason: input.reason,
    optionalDocument: input.optionalDocument,
  });

  const previousState = row.status;
  const next = updateCollaborator(input.internalEnterpriseUserId, { status: "SUSPENDED" })!;
  invalidateAllSessionsForUser(input.internalEnterpriseUserId);
  runEnterpriseSecurityCleanup({
    enterpriseId: input.enterpriseId,
    internalEnterpriseUserId: input.internalEnterpriseUserId,
    reason: "suspend_user",
  });

  appendGovernanceHistory({
    enterpriseId: input.enterpriseId,
    action: "SUSPEND_USER",
    author: input.author,
    authorLevel: input.authorLevel,
    target: input.internalEnterpriseUserId,
    note: input.reason,
    document: input.optionalDocument,
    previousState,
    newState: "SUSPENDED",
  });

  return next;
}

export function reactivateEnterpriseUser(input: {
  internalEnterpriseUserId: string;
  enterpriseId: string;
  author: string;
  authorLevel: GovernanceLevel;
  reason: string;
  optionalDocument?: string;
}): EnterpriseCollaboratorOnboarding {
  assertGovernanceNote(input.reason);
  const row = getCollaborator(input.internalEnterpriseUserId);
  if (!row) throw new Error("COLLABORATOR_NOT_FOUND");

  createGovernanceActionNote({
    actionType: "REACTIVATE_USER",
    author: input.author,
    authorLevel: input.authorLevel,
    target: input.internalEnterpriseUserId,
    reason: input.reason,
    optionalDocument: input.optionalDocument,
  });

  const previousState = row.status;
  const next = updateCollaborator(input.internalEnterpriseUserId, { status: "ACTIVE" })!;

  appendGovernanceHistory({
    enterpriseId: input.enterpriseId,
    action: "REACTIVATE_USER",
    author: input.author,
    authorLevel: input.authorLevel,
    target: input.internalEnterpriseUserId,
    note: input.reason,
    document: input.optionalDocument,
    previousState,
    newState: "ACTIVE",
  });

  return next;
}

export function archiveEnterpriseUser(input: {
  internalEnterpriseUserId: string;
  enterpriseId: string;
  author: string;
  authorLevel: GovernanceLevel;
  reason: string;
  optionalDocument?: string;
}): EnterpriseCollaboratorOnboarding {
  assertGovernanceNote(input.reason);
  const existing = getCollaborator(input.internalEnterpriseUserId);
  if (!existing) throw new Error("COLLABORATOR_NOT_FOUND");

  archiveInsteadOfDelete({ ...existing });

  createGovernanceActionNote({
    actionType: "ARCHIVE_USER",
    author: input.author,
    authorLevel: input.authorLevel,
    target: input.internalEnterpriseUserId,
    reason: input.reason,
    optionalDocument: input.optionalDocument,
  });

  const previousState = existing!.status;
  const next = updateCollaborator(input.internalEnterpriseUserId, {
    status: "ARCHIVED",
    archivedAt: new Date().toISOString(),
  })!;
  invalidateAllSessionsForUser(input.internalEnterpriseUserId);
  runEnterpriseSecurityCleanup({
    enterpriseId: input.enterpriseId,
    internalEnterpriseUserId: input.internalEnterpriseUserId,
    reason: "archive_user",
  });

  appendGovernanceHistory({
    enterpriseId: input.enterpriseId,
    action: "ARCHIVE_USER",
    author: input.author,
    authorLevel: input.authorLevel,
    target: input.internalEnterpriseUserId,
    note: input.reason,
    document: input.optionalDocument,
    previousState,
    newState: "ARCHIVED",
  });

  return next;
}

export function replaceEnterpriseUser(input: {
  previousInternalUserId: string;
  enterpriseId: string;
  poleId: string;
  author: string;
  authorLevel: GovernanceLevel;
  reason: string;
  optionalDocument?: string;
  newUser: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    idDocumentNumber: string;
  };
}): { archived: EnterpriseCollaboratorOnboarding; replacement: EnterpriseCollaboratorOnboarding } {
  assertGovernanceNote(input.reason);
  const archived = archiveEnterpriseUser({
    internalEnterpriseUserId: input.previousInternalUserId,
    enterpriseId: input.enterpriseId,
    author: input.author,
    authorLevel: input.authorLevel,
    reason: input.reason,
    optionalDocument: input.optionalDocument,
  });

  const replacement = registerCollaboratorOnboarding({
    enterpriseId: input.enterpriseId,
    poleId: input.poleId,
    ...input.newUser,
  });

  createGovernanceActionNote({
    actionType: "REPLACE_USER",
    author: input.author,
    authorLevel: input.authorLevel,
    target: `${input.previousInternalUserId}->${replacement.internalEnterpriseUserId}`,
    reason: input.reason,
    optionalDocument: input.optionalDocument,
  });

  updateCollaborator(input.previousInternalUserId, {
    replacedByInternalUserId: replacement.internalEnterpriseUserId,
  });
  revokeAllEnterpriseInvitations(input.enterpriseId);
  for (const d of listTrustedDevices(input.enterpriseId)) {
    if (d.internalEnterpriseUserId === input.previousInternalUserId) {
      revokeEnterpriseDevice(d.id);
    }
  }
  runEnterpriseSecurityCleanup({
    enterpriseId: input.enterpriseId,
    internalEnterpriseUserId: input.previousInternalUserId,
    reason: "replace_user",
  });

  appendGovernanceHistory({
    enterpriseId: input.enterpriseId,
    action: "REPLACE_USER",
    author: input.author,
    authorLevel: input.authorLevel,
    target: replacement.internalEnterpriseUserId,
    note: input.reason,
    document: input.optionalDocument,
    previousState: archived.status,
    newState: "PENDING_VALIDATION",
  });

  return { archived, replacement };
}

export function archiveEnterpriseChannel(input: {
  enterpriseId: string;
  author: string;
  authorLevel: GovernanceLevel;
  reason: string;
  cessationDocument?: string;
}): void {
  assertPartnerCannotExecuteGlobalAction("ARCHIVE_ENTERPRISE", input.authorLevel);
  if (input.authorLevel !== "VENEXT_GLOBAL") {
    throw new GovernanceLevelForbiddenError("ARCHIVE_ENTERPRISE", input.authorLevel);
  }
  assertGovernanceNote(input.reason);
  if (!input.cessationDocument?.trim()) {
    throw new Error("GOVERNANCE_CESSATION_DOCUMENT_REQUIRED");
  }

  const channel = getEnterpriseChannel(input.enterpriseId);
  if (!channel) throw new Error("ENTERPRISE_CHANNEL_NOT_FOUND");

  createGovernanceActionNote({
    actionType: "ARCHIVE_ENTERPRISE",
    author: input.author,
    authorLevel: input.authorLevel,
    target: input.enterpriseId,
    reason: input.reason,
    optionalDocument: input.cessationDocument,
  });

  updateEnterpriseChannel(input.enterpriseId, {
    governanceStatus: "ARCHIVED",
    activationStatus: "SUSPENDED",
  });
  invalidateAllSessionsForEnterprise(input.enterpriseId);
  revokeActivationLinkCascade(input.enterpriseId);
  runEnterpriseSecurityCleanup({
    enterpriseId: input.enterpriseId,
    reason: "archive_enterprise",
  });

  appendGovernanceHistory({
    enterpriseId: input.enterpriseId,
    action: "ARCHIVE_ENTERPRISE",
    author: input.author,
    authorLevel: input.authorLevel,
    target: input.enterpriseId,
    note: input.reason,
    document: input.cessationDocument,
    previousState: channel.governanceStatus,
    newState: "ARCHIVED",
  });
}

export function reactivateEnterpriseChannel(input: {
  enterpriseId: string;
  author: string;
  reason: string;
  optionalDocument?: string;
}): void {
  assertGovernanceNote(input.reason);
  const channel = getEnterpriseChannel(input.enterpriseId);
  if (!channel) throw new Error("ENTERPRISE_CHANNEL_NOT_FOUND");

  createGovernanceActionNote({
    actionType: "REACTIVATE_ENTERPRISE",
    author: input.author,
    authorLevel: "VENEXT_GLOBAL",
    target: input.enterpriseId,
    reason: input.reason,
    optionalDocument: input.optionalDocument,
  });

  updateEnterpriseChannel(input.enterpriseId, {
    governanceStatus: "ACTIVE",
    activationStatus: "ACTIVE",
  });

  appendGovernanceHistory({
    enterpriseId: input.enterpriseId,
    action: "REACTIVATE_ENTERPRISE",
    author: input.author,
    authorLevel: "VENEXT_GLOBAL",
    target: input.enterpriseId,
    note: input.reason,
    document: input.optionalDocument,
    previousState: channel.governanceStatus,
    newState: "ACTIVE",
  });
}

export function executeEnterpriseSecurityAction(input: {
  action: EnterpriseSecurityActionType;
  author: string;
  authorLevel: GovernanceLevel;
  enterpriseId: string;
  target: string;
  reason: string;
  optionalDocument?: string;
  sessionId?: string;
  deviceId?: string;
  newUser?: {
    poleId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    idDocumentNumber: string;
  };
}): unknown {
  assertGovernanceNote(input.reason);
  assertPartnerCannotExecuteGlobalAction(input.action, input.authorLevel);

  switch (input.action) {
    case "SUSPEND_USER":
      return suspendEnterpriseUser({
        internalEnterpriseUserId: input.target,
        enterpriseId: input.enterpriseId,
        author: input.author,
        authorLevel: input.authorLevel,
        reason: input.reason,
        optionalDocument: input.optionalDocument,
      });
    case "REACTIVATE_USER":
      return reactivateEnterpriseUser({
        internalEnterpriseUserId: input.target,
        enterpriseId: input.enterpriseId,
        author: input.author,
        authorLevel: input.authorLevel,
        reason: input.reason,
        optionalDocument: input.optionalDocument,
      });
    case "ARCHIVE_USER":
      return archiveEnterpriseUser({
        internalEnterpriseUserId: input.target,
        enterpriseId: input.enterpriseId,
        author: input.author,
        authorLevel: input.authorLevel,
        reason: input.reason,
        optionalDocument: input.optionalDocument,
      });
    case "REPLACE_USER":
      if (!input.newUser) throw new Error("REPLACE_USER_REQUIRES_NEW_USER");
      return replaceEnterpriseUser({
        previousInternalUserId: input.target,
        enterpriseId: input.enterpriseId,
        poleId: input.newUser.poleId,
        author: input.author,
        authorLevel: input.authorLevel,
        reason: input.reason,
        optionalDocument: input.optionalDocument,
        newUser: input.newUser,
      });
    case "APPROVE_DEVICE": {
      const device = getTrustedDevice(input.target);
      if (!device) throw new Error("DEVICE_NOT_FOUND");
      createGovernanceActionNote({
        actionType: "APPROVE_DEVICE",
        author: input.author,
        authorLevel: input.authorLevel,
        target: input.target,
        reason: input.reason,
      });
      return approveTrustedDevice(device);
    }
    case "REVOKE_DEVICE": {
      const device = getTrustedDevice(input.target);
      if (!device) throw new Error("DEVICE_NOT_FOUND");
      createGovernanceActionNote({
        actionType: "REVOKE_DEVICE",
        author: input.author,
        authorLevel: input.authorLevel,
        target: input.target,
        reason: input.reason,
      });
      return revokeTrustedDevice(device);
    }
    case "INVALIDATE_SESSION":
      if (!input.sessionId) throw new Error("SESSION_ID_REQUIRED");
      createGovernanceActionNote({
        actionType: "INVALIDATE_SESSION",
        author: input.author,
        authorLevel: input.authorLevel,
        target: input.sessionId,
        reason: input.reason,
      });
      return invalidateSession(input.sessionId);
    case "ARCHIVE_ENTERPRISE":
      archiveEnterpriseChannel({
        enterpriseId: input.enterpriseId,
        author: input.author,
        authorLevel: input.authorLevel,
        reason: input.reason,
        cessationDocument: input.optionalDocument,
      });
      return { archived: true };
    case "REACTIVATE_ENTERPRISE":
      reactivateEnterpriseChannel({
        enterpriseId: input.enterpriseId,
        author: input.author,
        reason: input.reason,
        optionalDocument: input.optionalDocument,
      });
      return { reactivated: true };
    default:
      preventHardDelete("unknown_action");
  }
}

export function logConnectionActivity(input: {
  enterpriseId: string;
  internalEnterpriseUserId?: string;
  ipAddress?: string;
  machineFingerprint?: string;
  success: boolean;
}): void {
  const knownIps = listTrustedIps(input.enterpriseId).map((i) => i.ipAddress);
  const knownDevices = listTrustedDevices(input.enterpriseId).map((d) => d.fingerprint);
  if (!input.success) {
    detectFailedLoginAlerts(input.enterpriseId, knownIps, knownDevices, input.ipAddress, input.machineFingerprint);
  }
}

function detectFailedLoginAlerts(
  enterpriseId: string,
  knownIps: string[],
  knownDevices: string[],
  ipAddress?: string,
  machineFingerprint?: string,
): void {
  detectSecurityAlerts({
    enterpriseId,
    ipAddress,
    machineFingerprint,
    knownIps,
    knownDevices,
    failedAttempts: 5,
  });
}

export function resetEnterpriseSecurityGovernanceStorage(): void {
  notes.length = 0;
}
