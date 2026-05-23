import type { CSSProperties, ReactNode } from "react";

import { getErrorStateMessage } from "./commerce-ux-error-messages";
import type { CommerceErrorStateKey } from "./commerce-ux-harmony.types";

export type VenextCommerceErrorStateProps = {
  stateKey: CommerceErrorStateKey;
  locale?: string;
  title?: string;
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function VenextCommerceErrorState({
  stateKey,
  locale = "fr-CI",
  title,
  action,
  className = "",
  style,
}: VenextCommerceErrorStateProps) {
  const resolvedTitle = title ?? getErrorStateMessage(stateKey, locale);
  return (
    <div
      className={`venext-error ${className}`.trim()}
      style={style}
      role="alert"
      aria-live="assertive"
    >
      <p className="venext-error__title">{resolvedTitle}</p>
      {action ? <div className="venext-error__action">{action}</div> : null}
    </div>
  );
}
