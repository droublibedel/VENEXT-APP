import type { CommercialActivityFilter } from "./commercial-activity-feed.types";
import { getActivityTranslation } from "./commercial-activity-feed-i18n";

const FILTERS: { id: CommercialActivityFilter; key: string }[] = [
  { id: "all", key: "activity.filters.all" },
  { id: "orders", key: "activity.filters.orders" },
  { id: "deliveries", key: "activity.filters.deliveries" },
  { id: "settlements", key: "activity.filters.settlements" },
  { id: "catalogs", key: "activity.filters.catalogs" },
  { id: "partners", key: "activity.filters.partners" },
  { id: "messages", key: "activity.filters.messages" },
  { id: "mails", key: "activity.filters.mails" },
  { id: "wallet", key: "activity.filters.wallet" },
];

type Props = {
  value: CommercialActivityFilter;
  onChange: (f: CommercialActivityFilter) => void;
  locale?: string;
};

export function CommercialActivityFilters({ value, onChange, locale = "fr-CI" }: Props) {
  return (
    <div className="caf-filters" data-testid="caf-filters">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`caf-filter-btn${value === f.id ? " caf-filter-btn--active" : ""}`}
          onClick={() => onChange(f.id)}
        >
          {getActivityTranslation(f.key, locale)}
        </button>
      ))}
    </div>
  );
}
