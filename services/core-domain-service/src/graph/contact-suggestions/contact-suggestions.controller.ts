import { Body, Controller, Post } from "@nestjs/common";
import { ContactImportDtoSchema } from "@venext/shared-contracts";
import { ContactSuggestionService } from "./contact-suggestion.service";

@Controller("contact-suggestions")
export class ContactSuggestionsController {
  constructor(private readonly suggestions: ContactSuggestionService) {}

  @Post("import")
  import(@Body() body: unknown) {
    const dto = ContactImportDtoSchema.parse(body);
    return this.suggestions.importContacts(dto);
  }
}
