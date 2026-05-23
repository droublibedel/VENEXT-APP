import { buildGroupLabel } from "./commercial-activity-feed-intelligence";
import type { CommercialActivityGroup as Group } from "./commercial-activity-feed.types";
import { CommercialActivityCard } from "./CommercialActivityCard";
import type { CommercialActivityItem } from "./commercial-activity-feed.types";

type Props = {
  group: Group;
  locale?: string;
  onOpen?: (item: CommercialActivityItem) => void;
};

export function CommercialActivityGroupView({ group, locale, onOpen }: Props) {
  return (
    <section data-testid={`caf-group-${group.category}`}>
      <h3 className="caf-group-title">{buildGroupLabel(group.labelKey, group.count, locale)}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {group.items.map((item) => (
          <CommercialActivityCard
            key={item.id}
            item={item}
            locale={locale}
            onOpen={onOpen ? () => onOpen(item) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
