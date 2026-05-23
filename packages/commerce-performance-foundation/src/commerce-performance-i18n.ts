const loadedDomains = new Set<string>();

export function domainCacheKey(locale: string, domain: string): string {
  return `${locale}:${domain}`;
}

export function markDomainLoaded(locale: string, domain: string): void {
  loadedDomains.add(domainCacheKey(locale, domain));
}

export function isDomainLoaded(locale: string, domain: string): boolean {
  return loadedDomains.has(domainCacheKey(locale, domain));
}

export function clearDomainLoadCache(): void {
  loadedDomains.clear();
}

/** Memo key for translation lookups — avoids reloading all locales at boot. */
export function memoTranslationKey(
  locale: string,
  domain: string,
  key: string,
): string {
  return `${locale}|${domain}|${key}`;
}
