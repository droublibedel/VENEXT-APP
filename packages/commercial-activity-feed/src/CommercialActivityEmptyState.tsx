import { getActivityTranslation } from "./commercial-activity-feed-i18n";

export function CommercialActivityEmptyState({ locale = "fr-CI" }: { locale?: string }) {
  return (
    <div className="caf-empty" data-testid="caf-empty">
      {getActivityTranslation("activity.empty", locale)}
    </div>
  );
}
