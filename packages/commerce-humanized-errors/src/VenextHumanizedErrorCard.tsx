import type { ReactNode } from "react";

import { recoveryActionLabel } from "./commerce-error-recovery";
import type { HumanizedCommerceError } from "./commerce-humanized-errors.types";

export type VenextHumanizedErrorCardProps = {
  error: HumanizedCommerceError;
  locale?: string;
  onRetry?: () => void;
  onBack?: () => void;
  onContinue?: () => void;
  className?: string;
  testId?: string;
};

export function VenextHumanizedErrorCard({
  error,
  locale = "fr-CI",
  onRetry,
  onBack,
  onContinue,
  className = "",
  testId = "venext-humanized-error-card",
}: VenextHumanizedErrorCardProps) {
  const actions: ReactNode[] = [];

  for (const action of error.recovery) {
    if (action === "retry" && onRetry) {
      actions.push(
        <button
          key="retry"
          type="button"
          className="venext-humanized-error__btn venext-humanized-error__btn--primary"
          data-testid="venext-error-retry"
          onClick={onRetry}
        >
          {recoveryActionLabel("retry", locale)}
        </button>,
      );
    }
    if (action === "back" && onBack) {
      actions.push(
        <button
          key="back"
          type="button"
          className="venext-humanized-error__btn"
          data-testid="venext-error-back"
          onClick={onBack}
        >
          {recoveryActionLabel("back", locale)}
        </button>,
      );
    }
    if (action === "continue" && onContinue) {
      actions.push(
        <button
          key="continue"
          type="button"
          className="venext-humanized-error__btn"
          data-testid="venext-error-continue"
          onClick={onContinue}
        >
          {recoveryActionLabel("continue", locale)}
        </button>,
      );
    }
  }

  return (
    <div
      className={`venext-humanized-error ${className}`.trim()}
      role="alert"
      aria-live="assertive"
      data-testid={testId}
    >
      <p className="venext-humanized-error__title" data-testid="venext-error-title">
        {error.title}
      </p>
      <p className="venext-humanized-error__message" data-testid="venext-error-message">
        {error.message}
      </p>
      {actions.length > 0 ? (
        <div className="venext-humanized-error__actions">{actions}</div>
      ) : null}
    </div>
  );
}
