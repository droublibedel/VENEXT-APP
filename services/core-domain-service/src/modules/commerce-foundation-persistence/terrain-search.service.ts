import { Injectable } from "@nestjs/common";

import { CommerceFoundationService } from "./commerce-foundation.service";

export type TerrainSearchResultRow = {
  id: string;
  kind: "partner" | "product" | "city" | "activity" | "contact" | "shop";
  label: string;
  subtitle?: string;
};

@Injectable()
export class TerrainSearchService {
  constructor(private readonly foundation: CommerceFoundationService) {}

  async search(query: string, organizationId: string, _actorRole?: string) {
    const q = query.trim().toLowerCase();
    if (!q) return { query, results: [] as TerrainSearchResultRow[] };

    const results: TerrainSearchResultRow[] = [];
    const seen = new Set<string>();

    const push = (row: TerrainSearchResultRow) => {
      const key = `${row.kind}:${row.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push(row);
    };

    const profiles = await this.foundation.list<Record<string, unknown>>("ActorProfile", { limit: 100 });
    for (const p of profiles) {
      const displayName = String(p.displayName ?? "");
      const businessName = String(p.businessName ?? displayName);
      const city = String(p.city ?? "");
      const phone = String(p.phone ?? "");
      const activities = Array.isArray(p.activities) ? p.activities.map(String) : [];
      const haystack = [displayName, businessName, city, phone, ...activities].join(" ").toLowerCase();
      if (!haystack.includes(q)) continue;

      push({
        id: String(p.id ?? p.organizationId ?? displayName),
        kind: "shop",
        label: businessName || displayName,
        subtitle: city || undefined,
      });

      if (city.toLowerCase().includes(q)) {
        push({ id: `city-${city}`, kind: "city", label: city });
      }

      for (const activity of activities) {
        if (activity.toLowerCase().includes(q)) {
          push({ id: `activity-${activity}`, kind: "activity", label: activity });
        }
      }

      if (phone.includes(q.replace(/\D/g, ""))) {
        push({ id: `contact-${phone}`, kind: "contact", label: displayName, subtitle: phone });
      }
    }

    const rels = organizationId
      ? await this.foundation.relationships.listForOrganization(organizationId)
      : [];
    for (const r of rels) {
      const partnerId = r.actorAId === organizationId ? String(r.actorBId) : String(r.actorAId);
      if (!partnerId.toLowerCase().includes(q)) continue;
      push({ id: String(r.id), kind: "partner", label: partnerId, subtitle: String(r.relationshipType ?? "partenaire") });
    }

    const catalogs = await this.foundation.catalogs.listCatalogs({ organizationId, limit: 20 });
    for (const c of catalogs) {
      const products = Array.isArray(c.products) ? c.products : [];
      for (const raw of products) {
        const product = raw as Record<string, unknown>;
        const name = String(product.name ?? product.label ?? product.id ?? "");
        const category = String(product.category ?? "");
        if (!`${name} ${category}`.toLowerCase().includes(q)) continue;
        push({
          id: String(product.id ?? name),
          kind: "product",
          label: name,
          subtitle: category || undefined,
        });
      }
    }

    return { query, results: results.slice(0, 30) };
  }
}
