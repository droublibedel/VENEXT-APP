import { getOfflineTranslation } from "./commerce-offline-i18n";

export function CommerceOfflineEmptyState({ locale = "fr-CI" }: { locale?: string }) {
  return (
    <div className="cof-empty" data-testid="cof-queue-empty">
      {getOfflineTranslation("offline.queue.empty", locale)}
    </div>
  );
}
