import { getNotificationTranslation } from "./commerce-notifications-i18n";

type Props = { locale?: string };

export function CommerceNotificationEmptyState({ locale = "fr-CI" }: Props) {
  return (
    <div className="cn-empty" data-testid="cn-empty">
      {getNotificationTranslation("notifications.empty", locale)}
    </div>
  );
}
