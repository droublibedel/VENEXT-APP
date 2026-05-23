import type { EnterpriseGovernanceDataSource } from "./enterprise-governance-ui.persistence-mode";

type Props = {
  dataSource: EnterpriseGovernanceDataSource;
  fallbackUsed?: boolean;
  error?: string;
};

export function EnterpriseGovernanceDataSourceBadge({ dataSource, fallbackUsed, error }: Props) {
  const isFallback = dataSource === "FALLBACK" || dataSource === "HYBRID" || fallbackUsed;
  return (
    <p
      className={`ecg-source-badge ${isFallback ? "ecg-source-fallback" : "ecg-source-live"}`}
      data-testid="enterprise-governance-source-badge"
    >
      {isFallback ? "Données locales de secours" : "Source LIVE"}
      {error ? ` · ${error}` : ""}
    </p>
  );
}
