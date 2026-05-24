import { memo } from "react";

type Props = {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export const GrossisteScreenHeader = memo(function GrossisteScreenHeader({
  title,
  subtitle,
  onRefresh,
  refreshing,
}: Props) {
  return (
    <header className="grossiste-b-screen-header" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--venext-text)" }}>{title}</h1>
          {subtitle ? (
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--venext-text-muted)" }}>{subtitle}</p>
          ) : null}
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            data-testid="grossiste-refresh"
            style={{
              minHeight: 44,
              minWidth: 44,
              borderRadius: 12,
              background: "var(--venext-accent-soft)",
              color: "var(--venext-accent)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {refreshing ? "…" : "↻"}
          </button>
        ) : null}
      </div>
    </header>
  );
});
