import { memo, useMemo, useState } from "react";

import { VenextTerrainGlobalSearch, VenextTerrainMobileHeader } from "commerce-ux-harmony";
import "commerce-ux-harmony/terrain-header.css";
import "commerce-ux-harmony/terrain-search.css";

import { resolveGrossisteBOrganizationId } from "../session/resolveGrossisteBOrganizationId";
import { GrossisteBNotificationsBridge } from "../notifications/GrossisteBNotificationsBridge";
import { fetchTerrainGlobalSearch } from "../search/terrain-global-search.api";

export const GrossisteBTerrainHeader = memo(function GrossisteBTerrainHeader({
  onMessaging,
  onProfile,
}: {
  onMessaging: () => void;
  onProfile: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const organizationId = useMemo(() => resolveGrossisteBOrganizationId(), [searchOpen]);

  return (
    <>
      <VenextTerrainMobileHeader
        onMessaging={onMessaging}
        onSearch={() => setSearchOpen(true)}
        onProfile={onProfile}
        notificationsSlot={<GrossisteBNotificationsBridge />}
      />
      <VenextTerrainGlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        organizationId={organizationId}
        actorRole="GROSSISTE_B"
        fetchSearch={(query, organizationId, actorRole) =>
          fetchTerrainGlobalSearch(query, organizationId, actorRole as "DETAILLANT" | "GROSSISTE_B")
        }
      />
    </>
  );
});
