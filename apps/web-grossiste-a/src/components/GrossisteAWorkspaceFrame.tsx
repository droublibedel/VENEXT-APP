import { memo, type ReactNode } from "react";

import type { GrossisteADataSource } from "../hooks/grossiste-a-data.types";

function sourceLabel(dataSource: GrossisteADataSource, fallbackUsed: boolean): string {
  if (dataSource === "live" && !fallbackUsed) return "Données synchronisées";
  if (dataSource === "mixed") return "Données synchronisées (complétées)";
  return "Données de démonstration enrichies";
}

export const GrossisteAWorkspaceFrame = memo(function GrossisteAWorkspaceFrame({
  title,
  subtitle,
  loading,
  onRefresh,
  dataSource,
  fallbackUsed,
  testId,
  children,
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  onRefresh?: () => void;
  dataSource: GrossisteADataSource;
  fallbackUsed: boolean;
  testId: string;
  children: ReactNode;
}) {
  return (
    <section data-testid={testId}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{title}</h1>
          {subtitle ? <p style={{ margin: "8px 0 0", fontSize: 14, color: "#8fa39a" }}>{subtitle}</p> : null}
        </div>
        {onRefresh ? (
          <button
            type="button"
            data-testid="ga-refresh"
            onClick={onRefresh}
            disabled={loading}
            style={{ minHeight: 40, padding: "0 16px", borderRadius: 10, background: "rgba(0,168,132,0.15)", color: "#00a884", fontWeight: 600, fontSize: 13 }}
          >
            {loading ? "…" : "Actualiser"}
          </button>
        ) : null}
      </header>
      {!loading ? (
        <p className="ga-source" data-testid="grossiste-a-data-source" data-fallback={fallbackUsed ? "true" : "false"}>
          {sourceLabel(dataSource, fallbackUsed)}
        </p>
      ) : null}
      {children}
    </section>
  );
});
