import type { CSSProperties, ReactNode } from "react";

import { getEmptyStateMessage } from "./commerce-ux-empty-messages";
import type { CommerceEmptyStateKey, CommerceUxActorKind } from "./commerce-ux-harmony.types";

export type VenextCommerceEmptyStateProps = {
  stateKey: CommerceEmptyStateKey;
  locale?: string;
  actorKind?: CommerceUxActorKind;
  title?: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function VenextCommerceEmptyState({
  stateKey,
  locale = "fr-CI",
  actorKind = "terrain",
  title,
  hint,
  icon,
  action,
  className = "",
  style,
}: VenextCommerceEmptyStateProps) {
  const resolvedTitle = title ?? getEmptyStateMessage(stateKey, locale, actorKind);
  return (
    <div
      className={`venext-empty ${className}`.trim()}
      style={style}
      role="status"
      aria-live="polite"
    >
      {icon ? <div className="venext-empty__icon">{icon}</div> : null}
      <p className="venext-empty__title">{resolvedTitle}</p>
      {hint ? <p className="venext-empty__hint">{hint}</p> : null}
      {action ? <div className="venext-empty__action">{action}</div> : null}
    </div>
  );
}
