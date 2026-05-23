import {
  RelationalFeedResolver,
  type RelationalFeedResolverInput,
} from "relational-commerce-feed/resolver";

export function resolveRelationalFeedBff(query: {
  actorId?: string;
  role?: string;
  city?: string;
  categories?: string;
  partnerIds?: string;
  partnersPublished?: string;
}): ReturnType<typeof RelationalFeedResolver> {
  const input: RelationalFeedResolverInput = {
    actorId: query.actorId ?? "org-grossiste-b-demo",
    role: (query.role as RelationalFeedResolverInput["role"]) ?? "detaillant",
    city: query.city ?? "Abidjan",
    categories: query.categories ? query.categories.split(",") : ["chaussures"],
    partnerIds: query.partnerIds ? query.partnerIds.split(",") : [],
    partnersPublished: query.partnersPublished !== "false",
  };
  return RelationalFeedResolver(input, 0);
}
