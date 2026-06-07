import { memo, useMemo, useState } from "react";

import { VenextTerrainGlobalSearch, VenextTerrainMobileHeader } from "commerce-ux-harmony";
import "commerce-ux-harmony/terrain-header.css";
import "commerce-ux-harmony/terrain-search.css";

import { DetaillantNotificationsBridge } from "../notifications/DetaillantNotificationsBridge";
import { fetchTerrainGlobalSearch } from "../search/terrain-global-search.api";
import { resolveDetaillantOrganizationId } from "../session/resolveDetaillantOrganizationId";

export const DetaillantTerrainHeader = memo(function DetaillantTerrainHeader({
  onMessaging,
  onProfile,
}: {
  onMessaging: () => void;
  onProfile: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const organizationId = useMemo(() => resolveDetaillantOrganizationId(), [searchOpen]);

  return (
    <>
      <VenextTerrainMobileHeader
        onMessaging={onMessaging}
        onSearch={() => setSearchOpen(true)}
        onProfile={onProfile}
        notificationsSlot={<DetaillantNotificationsBridge />}
      />
      <VenextTerrainGlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        organizationId={organizationId}
        actorRole="DETAILLANT"
        fetchSearch={(query, organizationId, actorRole) =>
          fetchTerrainGlobalSearch(query, organizationId, actorRole as "DETAILLANT" | "GROSSISTE_B")
        }
      />
    </>
  );
});
