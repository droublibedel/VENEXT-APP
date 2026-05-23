import { Module } from "@nestjs/common";
import { GraphCoreModule } from "../graph-core.module";
import { ContactSuggestionService } from "./contact-suggestion.service";
import { ContactSuggestionsController } from "./contact-suggestions.controller";

@Module({
  imports: [GraphCoreModule],
  controllers: [ContactSuggestionsController],
  providers: [ContactSuggestionService],
})
export class ContactSuggestionsModule {}
