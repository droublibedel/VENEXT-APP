import { getActivityTranslation } from "./commercial-activity-feed-i18n";
import type { CommercialActivityItem, CommercialActivityTimelineSection } from "./commercial-activity-feed.types";
import { CommercialActivityGroupView } from "./CommercialActivityGroup";
import { CommercialActivityCard } from "./CommercialActivityCard";

type Props = {
  sections: CommercialActivityTimelineSection[];
  locale?: string;
  groupingEnabled?: boolean;
  onOpen?: (item: CommercialActivityItem) => void;
};

export function CommercialActivityTimeline({
  sections,
  locale = "fr-CI",
  groupingEnabled = true,
  onOpen,
}: Props) {
  if (sections.length === 0) return null;
  return (
    <div data-testid="caf-timeline">
      {sections.map((section) => (
        <section key={section.bucket}>
          <h2 className="caf-timeline-label">{getActivityTranslation(section.labelKey, locale)}</h2>
          {groupingEnabled && section.groups.length > 0
            ? section.groups.map((g) => (
                <CommercialActivityGroupView key={g.id} group={g} locale={locale} onOpen={onOpen} />
              ))
            : section.items.map((item) => (
                <CommercialActivityCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  onOpen={onOpen ? () => onOpen(item) : undefined}
                />
              ))}
        </section>
      ))}
    </div>
  );
}
