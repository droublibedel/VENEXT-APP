import type { CommercialActivityFeedState } from "./commercial-activity-feed.types";
import type { CommercialActivityItem } from "./commercial-activity-feed.types";
import { CommercialActivityFeed } from "./CommercialActivityFeed";

type Props = {
  feed: CommercialActivityFeedState;
  locale?: string;
  onOpen?: (item: CommercialActivityItem) => void;
};

/** Feed mobile — même contenu, padding adapté terrain. */
export function CommercialActivityMobileFeed(props: Props) {
  return (
    <div style={{ paddingBottom: 24 }} data-testid="caf-mobile-feed">
      <CommercialActivityFeed {...props} />
    </div>
  );
}
