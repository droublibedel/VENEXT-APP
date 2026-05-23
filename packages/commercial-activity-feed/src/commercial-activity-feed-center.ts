import type {
  CommercialContextRouter,
  CommercialContextTransitionId,
} from "commercial-context-routing";

import type {
  CommercialActivityFeedFlags,
  CommercialActivityItem,
} from "./commercial-activity-feed.types";

export function openActivityContext(
  router: CommercialContextRouter,
  item: CommercialActivityItem,
  flags: CommercialActivityFeedFlags = {},
): boolean {
  if (flags.commercial_activity_feed_enabled === false) return false;
  const link = item.contextLink;
  if (!link?.module) return false;
  const transition: CommercialContextTransitionId =
    link.module === "order"
      ? "messaging-to-order"
      : link.module === "delivery"
        ? "order-to-delivery"
        : link.module === "wallet"
          ? "order-to-wallet"
          : link.module === "messaging"
            ? "order-to-messaging"
            : link.module === "mail"
              ? "order-to-mail"
              : link.module === "catalog"
                ? "context-back"
                : "context-back";
  router.navigate(transition, { activeModule: link.module, ...link });
  return true;
}
