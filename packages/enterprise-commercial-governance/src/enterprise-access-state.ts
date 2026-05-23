import type {
  EnterpriseActivationStatus,
  EnterpriseCommercialChannel,
  EnterpriseCollaboratorOnboarding,
} from "./enterprise-governance.types";
import { getEnterpriseChannel, getCollaborator } from "./enterprise-governance-storage";

/** États d'accès entreprise stricts (Instruction 20.86-D). */
export type EnterpriseAccessState = "PENDING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED" | "REVOKED";

export type ResolvedEnterpriseAccess = {
  state: EnterpriseAccessState;
  canNavigate: boolean;
  canUseWallet: boolean;
  canUseMessaging: boolean;
  canUseOffline: boolean;
  requiresReauth: boolean;
  userMessageKey?: string;
};

function mapCollaboratorStatus(status: EnterpriseActivationStatus): EnterpriseAccessState {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "SUSPENDED" || status === "BLOCKED") return "SUSPENDED";
  if (status === "ARCHIVED") return "ARCHIVED";
  if (status === "REJECTED") return "REVOKED";
  return "PENDING";
}

function mapChannelGovernance(channel: EnterpriseCommercialChannel): EnterpriseAccessState {
  if (channel.governanceStatus === "ARCHIVED" || channel.governanceStatus === "CLOSED") {
    return "ARCHIVED";
  }
  if (channel.governanceStatus === "SUSPENDED" || channel.activationStatus === "SUSPENDED") {
    return "SUSPENDED";
  }
  if (channel.governanceStatus === "ACTIVE" && channel.activationStatus === "ACTIVE") {
    return "ACTIVE";
  }
  return "PENDING";
}

export function resolveEnterpriseAccessState(input: {
  enterpriseId: string;
  internalEnterpriseUserId?: string;
}): ResolvedEnterpriseAccess {
  const channel = getEnterpriseChannel(input.enterpriseId);
  if (!channel) {
    return {
      state: "REVOKED",
      canNavigate: false,
      canUseWallet: false,
      canUseMessaging: false,
      canUseOffline: false,
      requiresReauth: true,
      userMessageKey: "enterprise.access.revoked",
    };
  }

  let state = mapChannelGovernance(channel);

  if (input.internalEnterpriseUserId) {
    const user = getCollaborator(input.internalEnterpriseUserId);
    if (user) {
      const userState = mapCollaboratorStatus(user.status);
      if (userState === "ARCHIVED" || userState === "REVOKED" || userState === "SUSPENDED") {
        state = userState;
      }
    }
  }

  const blocked = state !== "ACTIVE";
  return {
    state,
    canNavigate: !blocked,
    canUseWallet: state === "ACTIVE",
    canUseMessaging: state === "ACTIVE",
    canUseOffline: state === "ACTIVE",
    requiresReauth: state === "SUSPENDED" || state === "ARCHIVED" || state === "REVOKED",
    userMessageKey: blocked ? `enterprise.access.${state.toLowerCase()}` : undefined,
  };
}
