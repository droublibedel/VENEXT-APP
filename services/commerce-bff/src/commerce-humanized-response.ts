import {
  humanizeCommerceErrorMessage,
  sanitizeVisibleErrorText,
} from "commerce-humanized-errors/humanize";

/** Réponses BFF sans jargon technique (Instruction 20.84-A). */
export function toHumanizedBffUserMessage(
  error: unknown,
  fallback = "Cette action n’est pas disponible pour le moment.",
  locale = "fr-CI",
): string {
  if (!error) return fallback;
  if (typeof error === "string") {
    const safe = sanitizeVisibleErrorText(error, locale);
    return safe || fallback;
  }
  return humanizeCommerceErrorMessage(error, { locale, module: "commerce-bff" }) || fallback;
}
