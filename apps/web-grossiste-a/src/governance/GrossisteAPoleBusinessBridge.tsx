import { memo, useMemo } from "react";

import {
  GrossisteAPoleBusinessSurface,
  buildSharedCommerceSignals,
  poleForGrossisteAWorkspace,
  type GrossisteACanonicalPole,
} from "enterprise-commercial-governance";

import type { GrossisteAWorkspaceId } from "../navigation/grossiste-a-navigation.config";

export type GrossisteAPoleBusinessBridgeProps = {
  workspaceId: GrossisteAWorkspaceId;
  signalValues?: Partial<Record<string, string>>;
  onNavigateWorkspace?: (workspace: string) => void;
};

export const GrossisteAPoleBusinessBridge = memo(function GrossisteAPoleBusinessBridge({
  workspaceId,
  signalValues,
  onNavigateWorkspace,
}: GrossisteAPoleBusinessBridgeProps) {
  const pole = poleForGrossisteAWorkspace(workspaceId) as GrossisteACanonicalPole | null;
  const sharedSignals = useMemo(
    () =>
      buildSharedCommerceSignals({
        lateOrderCount: 1,
        pendingOrders: 3,
        pendingSettlements: 2,
        delayedDeliveries: 1,
        inactivePartners: 2,
      }),
    [],
  );

  if (!pole) return null;

  return (
    <GrossisteAPoleBusinessSurface
      pole={pole}
      signalValues={signalValues}
      sharedSignals={sharedSignals}
      onAction={(_id, targetWorkspace) => {
        if (targetWorkspace) onNavigateWorkspace?.(targetWorkspace);
      }}
    />
  );
});
