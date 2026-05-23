import { humanizeCommerceError } from "./commerce-humanized-errors";
import { VenextRecoverableErrorState } from "./VenextRecoverableErrorState";
import type { HumanizedCommerceError } from "./commerce-humanized-errors.types";

export type VenextGlobalRecoverableFallbackProps = {
  error?: unknown;
  humanized?: HumanizedCommerceError;
  locale?: string;
  title?: string;
  onRetry?: () => void;
  onBack?: () => void;
  onSafeNavigate?: () => void;
  className?: string;
  testId?: string;
};

/**
 * Fallback global doux — retry, retour, reprise navigation (Instruction 20.84-B).
 */
export function VenextGlobalRecoverableFallback({
  error,
  humanized,
  locale = "fr-CI",
  onRetry,
  onBack,
  onSafeNavigate,
  className,
  testId = "venext-global-recoverable-fallback",
}: VenextGlobalRecoverableFallbackProps) {
  const resolved =
    humanized ??
    humanizeCommerceError(error ?? new Error("unexpected"), {
      locale,
      fallbackKey: "unexpected",
      module: "global-fallback",
    });

  const handleBack = () => {
    onBack?.();
    onSafeNavigate?.();
    if (typeof window !== "undefined" && !onBack && !onSafeNavigate) {
      window.history.length > 1 ? window.history.back() : undefined;
    }
  };

  return (
    <div
      className={`venext-global-fallback ${className ?? ""}`.trim()}
      data-testid={testId}
      style={{
        padding: 20,
        borderRadius: 12,
        border: "1px solid rgba(155, 196, 180, 0.35)",
        background: "rgba(18, 24, 22, 0.92)",
        maxWidth: 420,
        margin: "24px auto",
      }}
    >
      <VenextRecoverableErrorState
        error={resolved}
        locale={locale}
        onRetry={onRetry}
        onBack={handleBack}
      />
    </div>
  );
}
