import type {
  EnterpriseActivationStatus,
  EnterpriseCollaboratorOnboarding,
  EnterpriseCommercialChannel,
  EnterprisePoleActivation,
  EnterpriseSecureInvitation,
  EnterpriseTrustedDevice,
  EnterpriseTrustedIp,
} from "./enterprise-governance.types";
import {
  buildEnterpriseRootLink,
  buildPoleActivationLink,
} from "./enterprise-activation-link-hierarchy";
import { generateEnterpriseSecureLink } from "./enterprise-secure-links";
import { getVenextCanonicalPole, listVenextCanonicalPoles, rejectUnknownPoleCreation } from "./venext-canonical-poles";
import { generateInternalEnterpriseUserId } from "./enterprise-onboarding-workflow";

const channels = new Map<string, EnterpriseCommercialChannel>();
const poleActivations = new Map<string, EnterprisePoleActivation>();
const invitations = new Map<string, EnterpriseSecureInvitation>();
const collaborators = new Map<string, EnterpriseCollaboratorOnboarding>();
const devices = new Map<string, EnterpriseTrustedDevice>();
const ips = new Map<string, EnterpriseTrustedIp>();

export function createEnterpriseChannel(
  draft: Omit<
    EnterpriseCommercialChannel,
    "createdAt" | "updatedAt" | "onboardingProgress" | "accountSegment"
  >,
): EnterpriseCommercialChannel {
  const now = new Date().toISOString();
  const channel: EnterpriseCommercialChannel = {
    ...draft,
    accountSegment: "LARGE_ACCOUNTS",
    onboardingProgress: 0,
    governanceStatus: draft.governanceStatus ?? "DRAFT",
    activationStatus: draft.activationStatus ?? "PENDING_VALIDATION",
    createdAt: now,
    updatedAt: now,
  };
  channels.set(channel.enterpriseId, channel);
  return channel;
}

export function getEnterpriseChannel(enterpriseId: string): EnterpriseCommercialChannel | undefined {
  return channels.get(enterpriseId);
}

export function listEnterpriseChannels(): EnterpriseCommercialChannel[] {
  return [...channels.values()];
}

export function updateEnterpriseChannel(
  enterpriseId: string,
  patch: Partial<EnterpriseCommercialChannel>,
): EnterpriseCommercialChannel | undefined {
  const existing = channels.get(enterpriseId);
  if (!existing) return undefined;
  const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  channels.set(enterpriseId, next);
  return next;
}

export function activateEnterprisePole(input: {
  enterpriseId: string;
  poleId: string;
  collaboratorEmail?: string;
}): EnterprisePoleActivation {
  rejectUnknownPoleCreation(input.poleId);
  const pole = getVenextCanonicalPole(input.poleId)!;
  const link = generateEnterpriseSecureLink({
    enterpriseId: input.enterpriseId,
    poleId: input.poleId,
  });
  invitations.set(link.invitation.token, link.invitation);

  const channel = getEnterpriseChannel(input.enterpriseId);
  if (channel?.actorKind === "grossiste_a") {
    try {
      const root = buildEnterpriseRootLink({
        enterpriseId: input.enterpriseId,
        actorKind: "grossiste_a",
      });
      buildPoleActivationLink({
        enterpriseId: input.enterpriseId,
        poleId: input.poleId,
        parentEnterpriseToken: root.secureToken,
      });
    } catch {
      /* hiérarchie optionnelle si canal incomplet */
    }
  }

  const id = `epa-${input.enterpriseId}-${input.poleId}`;
  const activation: EnterprisePoleActivation = {
    id,
    enterpriseId: input.enterpriseId,
    poleId: input.poleId,
    poleLabel: pole.label,
    activated: true,
    secureSlug: link.privateUrl.split("/").pop() ?? link.invitation.token.slice(0, 12),
    privateUrl: link.privateUrl,
    activationCode: link.activationCode,
    collaboratorEmail: input.collaboratorEmail,
    linkExpiresAt: link.invitation.expiresAt,
    createdAt: new Date().toISOString(),
  };
  poleActivations.set(id, activation);
  return activation;
}

export function listPoleActivations(enterpriseId: string): EnterprisePoleActivation[] {
  return [...poleActivations.values()].filter((p) => p.enterpriseId === enterpriseId);
}

export function listAvailablePolesForActivation(): ReturnType<typeof listVenextCanonicalPoles> {
  return listVenextCanonicalPoles();
}

export function registerCollaboratorOnboarding(input: {
  enterpriseId: string;
  poleId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  idDocumentNumber: string;
  machineFingerprint?: string;
  ipAddress?: string;
}): EnterpriseCollaboratorOnboarding {
  rejectUnknownPoleCreation(input.poleId);
  const row: EnterpriseCollaboratorOnboarding = {
    internalEnterpriseUserId: generateInternalEnterpriseUserId(input.enterpriseId),
    enterpriseId: input.enterpriseId,
    poleId: input.poleId,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    email: input.email,
    idDocumentNumber: input.idDocumentNumber,
    status: "PENDING_VALIDATION",
    machineFingerprint: input.machineFingerprint,
    ipAddress: input.ipAddress,
    createdAt: new Date().toISOString(),
  };
  collaborators.set(row.internalEnterpriseUserId, row);
  return row;
}

export function getCollaborator(internalEnterpriseUserId: string): EnterpriseCollaboratorOnboarding | undefined {
  return collaborators.get(internalEnterpriseUserId);
}

export function updateCollaborator(
  internalEnterpriseUserId: string,
  patch: Partial<EnterpriseCollaboratorOnboarding>,
): EnterpriseCollaboratorOnboarding | undefined {
  const row = collaborators.get(internalEnterpriseUserId);
  if (!row) return undefined;
  const next: EnterpriseCollaboratorOnboarding = { ...row, ...patch };
  collaborators.set(internalEnterpriseUserId, next);
  return next;
}

export function listPendingCollaborators(): EnterpriseCollaboratorOnboarding[] {
  return [...collaborators.values()].filter((c) => c.status === "PENDING_VALIDATION");
}

export function listCollaboratorsByEnterprise(enterpriseId: string): EnterpriseCollaboratorOnboarding[] {
  return [...collaborators.values()].filter((c) => c.enterpriseId === enterpriseId);
}

export function reviewCollaborator(
  internalEnterpriseUserId: string,
  action: "ACTIVATE" | "BLOCK" | "REJECT" | "SUSPEND",
): EnterpriseCollaboratorOnboarding | undefined {
  const row = collaborators.get(internalEnterpriseUserId);
  if (!row) return undefined;
  const status: EnterpriseActivationStatus =
    action === "ACTIVATE"
      ? "ACTIVE"
      : action === "BLOCK"
        ? "BLOCKED"
        : action === "REJECT"
          ? "REJECTED"
          : "SUSPENDED";
  const next: EnterpriseCollaboratorOnboarding = { ...row, status };
  collaborators.set(internalEnterpriseUserId, next);
  return next;
}

export function getInvitation(token: string): EnterpriseSecureInvitation | undefined {
  return invitations.get(token);
}

export function saveInvitation(invitation: EnterpriseSecureInvitation): void {
  invitations.set(invitation.token, invitation);
}

export function listInvitationsForEnterprise(enterpriseId: string): EnterpriseSecureInvitation[] {
  return [...invitations.values()].filter((i) => i.enterpriseId === enterpriseId);
}

export function saveTrustedDevice(device: EnterpriseTrustedDevice): void {
  devices.set(device.id, device);
}

export function registerTrustedDevice(input: Omit<EnterpriseTrustedDevice, "id" | "status">): EnterpriseTrustedDevice {
  const device: EnterpriseTrustedDevice = {
    ...input,
    id: `etd-${input.internalEnterpriseUserId}-${Date.now()}`,
    status: "APPROVED",
    lastSeenAt: new Date().toISOString(),
  };
  devices.set(device.id, device);
  return device;
}

export function listTrustedDevices(enterpriseId: string): EnterpriseTrustedDevice[] {
  return [...devices.values()].filter((d) => d.enterpriseId === enterpriseId);
}

export function getTrustedDevice(id: string): EnterpriseTrustedDevice | undefined {
  return devices.get(id);
}

export function registerTrustedIp(input: Omit<EnterpriseTrustedIp, "id" | "status">): EnterpriseTrustedIp {
  const row: EnterpriseTrustedIp = {
    ...input,
    id: `eti-${input.enterpriseId}-${input.ipAddress.replace(/\./g, "")}`,
    status: "KNOWN",
    lastSeenAt: new Date().toISOString(),
  };
  ips.set(row.id, row);
  return row;
}

export function listTrustedIps(enterpriseId: string): EnterpriseTrustedIp[] {
  return [...ips.values()].filter((i) => i.enterpriseId === enterpriseId);
}

export function resetEnterpriseGovernanceStorage(): void {
  channels.clear();
  poleActivations.clear();
  invitations.clear();
  collaborators.clear();
  devices.clear();
  ips.clear();
}
