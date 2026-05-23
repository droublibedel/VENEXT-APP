import { useState } from "react";

import { openNotificationContext } from "./commerce-notifications-center";
import { CommerceNotificationBell } from "./CommerceNotificationBell";
import { CommerceNotificationMobileSheet } from "./CommerceNotificationMobileSheet";
import { CommerceNotificationsCenter } from "./CommerceNotificationsCenter";
import type {
  CommerceActorRole,
  CommerceNotificationsFlags,
} from "./commerce-notifications.types";
import { useCommerceNotifications } from "./useCommerceNotifications";
import type { CommercialContextRouter } from "commercial-context-routing";

type Props = {
  actorRole: CommerceActorRole;
  organizationId: string;
  flags?: CommerceNotificationsFlags;
  flagsHydrated?: boolean;
  locale?: string;
  router?: CommercialContextRouter | null | undefined;
  variant?: "bell" | "center" | "both";
};

export function CommerceNotificationsShell({
  actorRole,
  organizationId,
  flags = {},
  flagsHydrated = true,
  locale = "fr-CI",
  router,
  variant = "both",
}: Props) {
  const [open, setOpen] = useState(false);
  const live = useCommerceNotifications({
    actorRole,
    organizationId,
    flags,
    flagsHydrated,
    enabled: flags.commerce_notifications_enabled !== false,
  });

  if (flags.commerce_notifications_enabled === false) return null;

  const handleOpen = (n: (typeof live.notifications)[0]) => {
    if (router) {
      openNotificationContext(router, n, flags);
    }
    void live.markRead(n.id);
    setOpen(false);
  };

  const center = (
    <CommerceNotificationsCenter
      notifications={live.notifications}
      unreadCount={live.unreadCount}
      locale={locale}
      fallbackUsed={live.fallbackUsed}
      onRefresh={live.refresh}
      loading={live.loading}
      onOpen={router ? handleOpen : undefined}
      onMarkRead={(id) => void live.markRead(id)}
      onMarkAllRead={() => void live.markAllRead()}
    />
  );

  return (
    <>
      {variant === "center" ? center : null}
      {variant !== "center" ? (
        <CommerceNotificationBell unreadCount={live.unreadCount} onClick={() => setOpen(true)} />
      ) : null}
      {variant !== "center" ? (
        <CommerceNotificationMobileSheet open={open} onClose={() => setOpen(false)}>
          {center}
        </CommerceNotificationMobileSheet>
      ) : null}
    </>
  );
}
