import { Module } from "@nestjs/common";
import { GraphCoreModule } from "./graph-core.module";
import { RelationshipModule } from "./relationship/relationship.module";
import { NetworkCodeGraphModule } from "./network-code/network-code.module";
import { ContactSuggestionsModule } from "./contact-suggestions/contact-suggestions.module";

/**
 * Relationship graph: invitations, network codes, contact suggestions,
 * catalog visibility resolver (registered via RelationshipModule → CatalogVisibilityModule).
 */
@Module({
  imports: [
    GraphCoreModule,
    RelationshipModule,
    NetworkCodeGraphModule,
    ContactSuggestionsModule,
  ],
})
export class GraphModule {}
