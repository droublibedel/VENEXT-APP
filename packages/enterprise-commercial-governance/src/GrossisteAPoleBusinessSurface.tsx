import type { GrossisteACanonicalPole } from "./grossiste-a-canonical-poles";
import {
  hydratePoleSignals,
  type GrossisteAPoleBusinessContent,
} from "./grossiste-a-pole-content";
import { signalsForPole, type SharedCommerceSignal } from "./grossiste-a-commerce-signals";

export type GrossisteAPoleBusinessSurfaceProps = {
  pole: GrossisteACanonicalPole;
  signalValues?: Partial<Record<string, string>>;
  sharedSignals?: SharedCommerceSignal[];
  onAction?: (actionId: string, targetWorkspace?: string) => void;
  testId?: string;
};

export function GrossisteAPoleBusinessSurface({
  pole,
  signalValues = {},
  sharedSignals = [],
  onAction,
  testId,
}: GrossisteAPoleBusinessSurfaceProps) {
  const content: GrossisteAPoleBusinessContent = hydratePoleSignals(pole, signalValues);
  const cross = signalsForPole(pole, sharedSignals);

  return (
    <section className="ecg-shell" data-testid={testId ?? `ga-pole-surface-${pole}`}>
      <header style={{ marginBottom: 12 }}>
        <h2 className="ecg-title" style={{ margin: 0, fontSize: 18 }}>
          {content.title}
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.85 }}>{content.subtitle}</p>
      </header>

      {cross.length > 0 ? (
        <>
          <p className="ecg-section-title">Signaux partagés VENEXT</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
            {cross.map((s) => (
              <li
                key={s.id}
                style={{
                  padding: "8px 10px",
                  marginBottom: 6,
                  borderRadius: 8,
                  border: "1px solid rgba(155,196,180,0.35)",
                  fontSize: 13,
                }}
                data-testid={`ga-shared-signal-${s.id}`}
              >
                {s.message}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="ecg-section-title">Activité du pôle</p>
      <div className="ga-metrics" style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {content.signals.map((signal) => (
          <article
            key={signal.id}
            className="ga-card"
            data-testid={`ga-pole-signal-${signal.id}`}
            style={{
              padding: 12,
              borderRadius: 10,
              border:
                signal.tone === "attention"
                  ? "1px solid rgba(200,160,80,0.5)"
                  : "1px solid rgba(155,196,180,0.25)",
            }}
          >
            <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>{signal.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 600 }}>{signal.value}</p>
          </article>
        ))}
      </div>

      {content.actions.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {content.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              data-testid={`ga-pole-action-${action.id}`}
              onClick={() => onAction?.(action.id, action.targetWorkspace)}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
