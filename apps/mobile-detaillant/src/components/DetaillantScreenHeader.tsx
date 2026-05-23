import { memo } from "react";

type Props = {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export const DetaillantScreenHeader = memo(function DetaillantScreenHeader({
  title,
  subtitle,
  onRefresh,
  refreshing,
}: Props) {
  return (
    <header style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f0f4f2" }}>{title}</h1>
          {subtitle ? (
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#8fa39a" }}>{subtitle}</p>
          ) : null}
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            data-testid="detaillant-refresh"
            style={{
              minHeight: 52,
              minWidth: 52,
              borderRadius: 14,
              background: "rgba(0, 168, 132, 0.18)",
              color: "#00a884",
              fontSize: 18,
              fontWeight: 700,
            }}
            aria-label="Actualiser"
          >
            {refreshing ? "…" : "↻"}
          </button>
        ) : null}
      </div>
    </header>
  );
});
