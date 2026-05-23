import { sanitizeVisibleErrorText } from "./commerce-humanized-errors";

export type VenextInlineErrorProps = {
  message: string;
  locale?: string;
  className?: string;
  testId?: string;
};

export function VenextInlineError({
  message,
  locale = "fr-CI",
  className = "",
  testId = "venext-inline-error",
}: VenextInlineErrorProps) {
  const safe = sanitizeVisibleErrorText(message, locale);
  return (
    <p className={`venext-inline-error ${className}`.trim()} role="status" data-testid={testId}>
      {safe}
    </p>
  );
}
