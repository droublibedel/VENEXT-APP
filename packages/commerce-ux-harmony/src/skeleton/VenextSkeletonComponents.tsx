import { VenextSkeletonBase } from "./VenextSkeletonBase";
import { SkeletonAvatar, SkeletonLines } from "./venext-skeleton-primitives";

export function VenextSkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="venext-skeleton-text" data-testid="venext-skeleton-text" aria-busy="true">
      <SkeletonLines lines={lines} />
    </div>
  );
}

export function VenextSkeletonCard() {
  return (
    <div className="venext-skeleton-card venext-card-harmony" data-testid="venext-skeleton-card" aria-busy="true">
      <SkeletonLines lines={2} />
      <VenextSkeletonBase height={80} radius="md" style={{ marginTop: 12 }} />
    </div>
  );
}

export function VenextSkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="venext-skeleton-list" data-testid="venext-skeleton-list" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="venext-skeleton-list__row">
          <SkeletonAvatar size={44} />
          <SkeletonLines lines={2} lastLineWidth="55%" />
        </div>
      ))}
    </div>
  );
}

export function VenextSkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="venext-skeleton-table" data-testid="venext-skeleton-table" aria-busy="true">
      <div className="venext-skeleton-table__head">
        {Array.from({ length: cols }, (_, c) => (
          <VenextSkeletonBase key={c} height={12} radius="sm" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="venext-skeleton-table__row">
          {Array.from({ length: cols }, (_, c) => (
            <VenextSkeletonBase key={c} height={14} radius="sm" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function VenextSkeletonChart({ tall }: { tall?: boolean }) {
  return (
    <div className="venext-skeleton-chart venext-card-harmony" data-testid="venext-skeleton-chart" aria-busy="true">
      <SkeletonLines lines={1} />
      <VenextSkeletonBase height={tall ? 200 : 140} radius="md" style={{ marginTop: 16 }} />
    </div>
  );
}

export function VenextSkeletonMessage({ rows = 5 }: { rows?: number }) {
  return (
    <div className="venext-skeleton-message" data-testid="venext-skeleton-message" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={`venext-skeleton-message__bubble ${i % 2 === 0 ? "venext-skeleton-message__bubble--left" : "venext-skeleton-message__bubble--right"}`}
        >
          <SkeletonAvatar size={32} />
          <VenextSkeletonBase height={48} width={i % 2 === 0 ? "68%" : "52%"} radius="lg" />
        </div>
      ))}
    </div>
  );
}

export function VenextSkeletonDashboard() {
  return (
    <div className="venext-skeleton-dashboard" data-testid="venext-skeleton-dashboard" aria-busy="true">
      <div className="venext-skeleton-dashboard__kpis">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="venext-skeleton-dashboard__kpi venext-card-harmony">
            <SkeletonLines lines={2} lastLineWidth="40%" />
          </div>
        ))}
      </div>
      <div className="venext-skeleton-dashboard__main">
        <VenextSkeletonChart tall />
        <VenextSkeletonList rows={3} />
      </div>
    </div>
  );
}

export function VenextSkeletonForm() {
  return (
    <div className="venext-skeleton-form" data-testid="venext-skeleton-form" aria-busy="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="venext-skeleton-form__field">
          <VenextSkeletonBase height={12} width="28%" radius="sm" />
          <VenextSkeletonBase height={48} radius="md" />
        </div>
      ))}
      <VenextSkeletonBase height={48} width={160} radius="md" style={{ marginTop: 8 }} />
    </div>
  );
}

export function VenextSkeletonProduct() {
  return (
    <div className="venext-skeleton-product" data-testid="venext-skeleton-product" aria-busy="true">
      <VenextSkeletonBase height={160} radius="lg" />
      <SkeletonLines lines={3} />
      <div className="venext-skeleton-product__actions">
        <VenextSkeletonBase height={44} width="48%" radius="md" />
        <VenextSkeletonBase height={44} width="48%" radius="md" />
      </div>
    </div>
  );
}

export function VenextSkeletonOrder() {
  return (
    <div className="venext-skeleton-order venext-card-harmony" data-testid="venext-skeleton-order" aria-busy="true">
      <div className="venext-skeleton-order__header">
        <SkeletonLines lines={1} />
        <VenextSkeletonBase height={24} width={88} radius="sm" />
      </div>
      <VenextSkeletonList rows={2} />
      <VenextSkeletonBase height={40} radius="md" style={{ marginTop: 12 }} />
    </div>
  );
}

export function VenextSkeletonPole({ tall }: { tall?: boolean }) {
  return (
    <div className="venext-skeleton-pole" data-testid="venext-skeleton-pole" aria-busy="true">
      <div className="venext-skeleton-pole__header">
        <SkeletonLines lines={2} />
      </div>
      <div className="venext-skeleton-pole__grid">
        <VenextSkeletonChart tall={tall} />
        <VenextSkeletonCard />
        <VenextSkeletonCard />
      </div>
    </div>
  );
}

export function VenextSkeletonWallet() {
  return (
    <div className="venext-skeleton-wallet" data-testid="venext-skeleton-wallet" aria-busy="true">
      <div className="venext-skeleton-wallet__balance venext-card-harmony">
        <SkeletonLines lines={2} lastLineWidth="35%" />
        <VenextSkeletonBase height={36} width="60%" radius="sm" style={{ marginTop: 12 }} />
      </div>
      <VenextSkeletonList rows={4} />
    </div>
  );
}

export function VenextSkeletonNotification() {
  return (
    <div data-testid="venext-skeleton-notification" aria-busy="true">
      <VenextSkeletonList rows={5} />
    </div>
  );
}
