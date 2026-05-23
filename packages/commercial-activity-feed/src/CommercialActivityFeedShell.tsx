import { CommercialActivityFeed } from "./CommercialActivityFeed";
import { CommercialActivityMobileFeed } from "./CommercialActivityMobileFeed";
import { openActivityContext } from "./commercial-activity-feed-center";
import type {
  CommercialActivityActorRole,
  CommercialActivityFeedFlags,
} from "./commercial-activity-feed.types";
import { useCommercialActivityFeed } from "./useCommercialActivityFeed";
import type { CommercialContextRouter } from "commercial-context-routing";

type Props = {
  actorRole: CommercialActivityActorRole;
  organizationId: string;
  flags?: CommercialActivityFeedFlags;
  flagsHydrated?: boolean;
  locale?: string;
  router?: CommercialContextRouter | null | undefined;
  variant?: "inline" | "mobile";
};

export function CommercialActivityFeedShell({
  actorRole,
  organizationId,
  flags = {},
  flagsHydrated = true,
  locale = "fr-CI",
  router,
  variant = "inline",
}: Props) {
  const feed = useCommercialActivityFeed({
    actorRole,
    organizationId,
    flags,
    flagsHydrated,
    enabled: flags.commercial_activity_feed_enabled !== false,
  });

  if (flags.commercial_activity_feed_enabled === false) return null;

  const handleOpen = (item: (typeof feed.items)[0]) => {
    if (router) openActivityContext(router, item, flags);
    void feed.markRead(item.id);
  };

  const Feed = variant === "mobile" ? CommercialActivityMobileFeed : CommercialActivityFeed;
  return <Feed feed={feed} locale={locale} onOpen={router ? handleOpen : undefined} />;
}
