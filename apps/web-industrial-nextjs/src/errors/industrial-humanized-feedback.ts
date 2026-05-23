import {
  humanizeCaughtError,
  humanizeCommerceErrorMessage,
  sanitizeVisibleErrorText,
  type HumanizeErrorOptions,
} from "commerce-humanized-errors";

const MODULE = "web-industrial-nextjs";

export function humanizedHttpFailure(
  status: number,
  body?: string | null,
  locale = "fr-CI",
): string {
  return humanizeCommerceErrorMessage(
    { status, message: body ?? "" },
    { locale, module: MODULE },
  );
}

export function humanizedNetworkFailure(locale = "fr-CI"): string {
  return humanizeCommerceErrorMessage(new Error("network"), {
    locale,
    module: MODULE,
    fallbackKey: "network_unstable",
  });
}

export function humanizedUserNotice(text: string, locale = "fr-CI"): string {
  return sanitizeVisibleErrorText(text, locale);
}

export function humanizeIndustrialCaught(
  error: unknown,
  options?: HumanizeErrorOptions,
): string {
  return humanizeCaughtError(error, { module: MODULE, ...options });
}

/** Lance une Error dont le message est déjà humanisé (safe pour catch → setState). */
export async function readHumanizedHttpFailure(
  response: Response,
  locale = "fr-CI",
): Promise<Error> {
  const body = await response.text().catch(() => "");
  return new Error(humanizedHttpFailure(response.status, body, locale));
}
