import { memo } from "react";

import { EnterpriseGlobalGovernanceControlPanel } from "enterprise-commercial-governance";

import { GrossisteAWorkspaceFrame } from "../components/GrossisteAWorkspaceFrame";
import { GrossisteAPoleBusinessBridge } from "../governance/GrossisteAPoleBusinessBridge";

export const GrossisteAGovernanceWorkspace = memo(function GrossisteAGovernanceWorkspace({
  enabled,
  onNavigateWorkspace,
}: {
  enabled: boolean;
  onNavigateWorkspace?: (workspace: string) => void;
}) {
  if (!enabled) return null;

  return (
    <GrossisteAWorkspaceFrame
      title="Sécurité & gouvernance"
      subtitle="Accès internes entreprise — jamais super-admin VENEXT global"
      dataSource="fallback"
      fallbackUsed
      testId="ga-workspace-governance"
    >
      <GrossisteAPoleBusinessBridge
        workspaceId="governance"
        onNavigateWorkspace={onNavigateWorkspace}
      />
      <p className="ga-section-title" style={{ marginTop: 20 }}>
        Contrôles locaux
      </p>
      <EnterpriseGlobalGovernanceControlPanel />
    </GrossisteAWorkspaceFrame>
  );
});
