import { useMemo } from "react";

import { buildProfessionalNetworkView } from "./professional-commercial-network.viewmodel";
import type {
  ProfessionalNetworkInjected,
  ProfessionalActorRole,
} from "./professional-commercial-network.types";

export function useProfessionalCommercialNetworkData(input: {
  actorRole: ProfessionalActorRole;
  injected?: ProfessionalNetworkInjected;
  enabled?: boolean;
}): ProfessionalNetworkInjected {
  const { actorRole, injected, enabled = true } = input;

  const fallbackView = useMemo(
    () => (enabled ? buildProfessionalNetworkView(actorRole) : null),
    [actorRole, enabled],
  );

  return {
    view: injected?.view ?? fallbackView,
    dataSource: injected?.dataSource ?? "fallback",
    fallbackUsed: injected?.fallbackUsed ?? true,
    loading: injected?.loading ?? false,
    error: injected?.error ?? null,
    onRefresh: injected?.onRefresh,
    onInvite: injected?.onInvite,
    onValidate: injected?.onValidate,
    onReject: injected?.onReject,
    onOpenMail: injected?.onOpenMail,
    onOpenMessaging: injected?.onOpenMessaging,
  };
}
