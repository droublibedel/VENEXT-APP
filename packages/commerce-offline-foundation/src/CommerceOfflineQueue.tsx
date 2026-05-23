import { getOfflineTranslation } from "./commerce-offline-i18n";
import type { CommerceOfflineQueueItem } from "./commerce-offline.types";
import { CommerceOfflineEmptyState } from "./CommerceOfflineEmptyState";

type Props = {
  items: CommerceOfflineQueueItem[];
  locale?: string;
  onDiscard?: (id: string) => void;
};

export function CommerceOfflineQueue({ items, locale = "fr-CI", onDiscard }: Props) {
  if (items.length === 0) return <CommerceOfflineEmptyState locale={locale} />;
  return (
    <section className="cof-queue" data-testid="cof-queue">
      <h3 style={{ margin: "0 0 8px", fontSize: 13, color: "#b8c9c0" }}>
        {getOfflineTranslation("offline.queue.title", locale)}
      </h3>
      {items.map((item) => (
        <div key={item.id} className="cof-queue-item" data-testid={`cof-queue-${item.id}`}>
          <span>{item.type}</span>
          {onDiscard ? (
            <button type="button" onClick={() => onDiscard(item.id)} style={{ float: "right", fontSize: 11 }}>
              ×
            </button>
          ) : null}
        </div>
      ))}
    </section>
  );
}
