import { memo, useMemo, useState } from "react";

import { VenextTerrainGlobalSearch, VenextTerrainMobileHeader } from "commerce-ux-harmony";
import "commerce-ux-harmony/terrain-header.css";
import "commerce-ux-harmony/terrain-search.css";

import { DetaillantNotificationsBridge } from "../notifications/DetaillantNotificationsBridge";
import { fetchTerrainGlobalSearch } from "../search/terrain-global-search.api";
import { resolveDetaillantOrganizationId } from "../session/resolveDetaillantOrganizationId";
import { DETAILLANT_TAB_TITLES, type DetaillantTabId } from "./detaillant-navigation.config";

export const DetaillantTerrainHeader = memo(function DetaillantTerrainHeader({
  activeTab,
  onMessaging,
  onProfile,
}: {
  activeTab: DetaillantTabId;
  onMessaging: () => void;
  onProfile: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const organizationId = useMemo(() => resolveDetaillantOrganizationId(), [searchOpen, activeTab]);

  return (
    <>
      <VenextTerrainMobileHeader
        title={DETAILLANT_TAB_TITLES[activeTab]}
        brandLabel="VENEXT"
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
