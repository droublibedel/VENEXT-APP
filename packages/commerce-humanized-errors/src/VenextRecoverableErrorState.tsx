import { VenextHumanizedErrorCard } from "./VenextHumanizedErrorCard";
import type { HumanizedCommerceError } from "./commerce-humanized-errors.types";

export type VenextRecoverableErrorStateProps = {
  error: HumanizedCommerceError;
  locale?: string;
  onRetry?: () => void;
  onBack?: () => void;
  onContinue?: () => void;
  className?: string;
};

export function VenextRecoverableErrorState(props: VenextRecoverableErrorStateProps) {
  return (
    <section
      className={`venext-recoverable-error ${props.className ?? ""}`.trim()}
      data-testid="venext-recoverable-error"
    >
      <VenextHumanizedErrorCard {...props} />
    </section>
  );
}
