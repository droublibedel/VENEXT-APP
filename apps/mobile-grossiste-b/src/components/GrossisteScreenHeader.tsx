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
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#f0f4f2" }}>{title}</h1>
          {subtitle ? (
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8fa39a" }}>{subtitle}</p>
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
              background: "rgba(0, 168, 132, 0.15)",
              color: "#00a884",
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
