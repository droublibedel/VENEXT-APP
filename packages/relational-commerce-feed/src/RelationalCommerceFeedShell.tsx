import { memo, useCallback, useMemo, useState } from "react";

import { trackRelationalFeedEvent } from "./relational-feed-observability.js";
import { RelationalFeedResolver } from "./relational-feed-resolver.js";
import { RelationalFeedCard } from "./RelationalFeedCard.js";
import type { RelationalFeedActorRole, RelationalFeedResolverInput } from "./relational-feed.types.js";

export const RelationalCommerceFeedShell = memo(function RelationalCommerceFeedShell({
  actorId,
  role,
  city = "Abidjan",
  categories = ["chaussures"],
  partnerIds = [],
  partnersPublished = true,
  contacts,
  testId = "relational-commerce-feed",
}: {
  actorId: string;
  role: RelationalFeedActorRole;
  city?: string;
  categories?: string[];
  partnerIds?: string[];
  partnersPublished?: boolean;
  contacts?: RelationalFeedResolverInput["contacts"];
  testId?: string;
}) {
  const [page, setPage] = useState(0);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  const input = useMemo(
    (): RelationalFeedResolverInput => ({
      actorId,
      role,
      city,
      categories,
      partnerIds,
      partnersPublished,
      contacts,
    }),
    [actorId, role, city, categories, partnerIds, partnersPublished, contacts],
  );

  const feed = useMemo(() => RelationalFeedResolver(input, page), [input, page]);

  const onInvite = useCallback((partnerId: string) => {
    trackRelationalFeedEvent("relational_invitation_sent", { partnerId });
    trackRelationalFeedEvent("relational_invitation_auto_accepted", { partnerId });
    setInvited((prev) => new Set(prev).add(partnerId));
  }, []);

  if (!feed.entries.length) {
    return (
      <section data-testid="rcf-fallback-loading" className="rcf-shell">
        <p style={{ color: "var(--venext-text-secondary, #526059)", fontSize: 13 }}>Chargement du réseau commercial…</p>
      </section>
    );
  }

  return (
    <section className="rcf-shell" data-testid={testId} data-empty-prevented={feed.feedEmptyPrevented}>
      <div className="rcf-feed-list" data-testid="rcf-feed-list">
        {feed.entries.map((entry) => (
          <RelationalFeedCard
            key={entry.id}
            entry={{
              ...entry,
              inviteable: entry.inviteable && !invited.has(entry.partnerId),
            }}
            onInvite={entry.inviteable ? onInvite : undefined}
          />
        ))}
      </div>
      {feed.hasMore ? (
        <button
          type="button"
          data-testid="rcf-load-more"
          onClick={() => setPage((p) => p + 1)}
          style={{ marginTop: 12, width: "100%", minHeight: 44 }}
        >
          Voir plus
        </button>
      ) : null}
    </section>
  );
});
