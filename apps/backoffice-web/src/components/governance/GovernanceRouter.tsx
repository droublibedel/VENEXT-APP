"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { OverviewScreen } from "./panels/OverviewScreen";
import { FeatureControlScreen } from "./panels/FeatureControlScreen";
import { OrganizationsScreen } from "./panels/OrganizationsScreen";
import { RelationshipsScreen } from "./panels/RelationshipsScreen";
import { SponsoredVisibilityScreen } from "./panels/SponsoredVisibilityScreen";
import { AiGatewayScreen } from "./panels/AiGatewayScreen";
import { RealtimeGovernanceScreen } from "./panels/RealtimeGovernanceScreen";
import { IndustrialPolesScreen } from "./panels/IndustrialPolesScreen";
import { PaymentsScreen } from "./panels/PaymentsScreen";
import { SafetyScreen } from "./panels/SafetyScreen";
import { DataQualityScreen } from "./panels/DataQualityScreen";
import { AuditLogsScreen } from "./panels/AuditLogsScreen";
import { EnterpriseGovernanceScreen } from "./panels/EnterpriseGovernanceScreen";

export function GovernanceRouter() {
  const pathname = usePathname();
  const slug = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("governance");
    return parts[idx + 1] ?? "overview";
  }, [pathname]);

  switch (slug) {
    case "overview":
      return <OverviewScreen />;
    case "features":
      return <FeatureControlScreen />;
    case "organizations":
      return <OrganizationsScreen />;
    case "relationships":
      return <RelationshipsScreen />;
    case "sponsored-visibility":
      return <SponsoredVisibilityScreen />;
    case "ai-gateway":
      return <AiGatewayScreen />;
    case "realtime":
      return <RealtimeGovernanceScreen />;
    case "industrial-poles":
      return <IndustrialPolesScreen />;
    case "payments":
      return <PaymentsScreen />;
    case "safety":
      return <SafetyScreen />;
    case "data-quality":
      return <DataQualityScreen />;
    case "audit-logs":
      return <AuditLogsScreen />;
    case "enterprise-governance":
      return <EnterpriseGovernanceScreen />;
    default:
      return <OverviewScreen />;
  }
}
