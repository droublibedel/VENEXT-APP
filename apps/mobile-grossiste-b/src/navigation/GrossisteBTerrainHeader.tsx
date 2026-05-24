import { memo, useMemo, useState } from "react";

import { VenextTerrainGlobalSearch, VenextTerrainMobileHeader } from "commerce-ux-harmony";
import "commerce-ux-harmony/terrain-header.css";
import "commerce-ux-harmony/terrain-search.css";

import { GROSSISTE_B_ORG_ID } from "../mocks/grossiste-b-mock-data";
import { GrossisteBNotificationsBridge } from "../notifications/GrossisteBNotificationsBridge";
import { fetchTerrainGlobalSearch } from "../search/terrain-global-search.api";
import { GROSSISTE_B_TAB_TITLES, type GrossisteBTabId } from "./grossiste-b-navigation.config";

export const GrossisteBTerrainHeader = memo(function GrossisteBTerrainHeader({
  activeTab,
  onMessaging,
  onProfile,
}: {
  activeTab: GrossisteBTabId;
  onMessaging: () => void;
  onProfile: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const organizationId = useMemo(() => GROSSISTE_B_ORG_ID, [searchOpen, activeTab]);

  return (
    <>
      <VenextTerrainMobileHeader
        title={GROSSISTE_B_TAB_TITLES[activeTab]}
        brandLabel="VENEXT"
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
