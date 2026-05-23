import type { VenextDirection, VenextLocale } from "./venext-i18n.types";

export function isRtlLocale(locale: VenextLocale): boolean {
  return locale === "ar";
}

export function getLocaleDirection(locale: VenextLocale): VenextDirection {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

export function applyLocaleDirection(
  locale: VenextLocale,
  root: HTMLElement | Document = document,
): VenextDirection {
  const direction = getLocaleDirection(locale);
  const el = root instanceof Document ? root.documentElement : root;
  el.setAttribute("dir", direction);
  el.setAttribute("lang", locale === "fr-CI" ? "fr" : locale === "zh-CN" ? "zh-Hans" : locale);
  el.dataset.venextDirection = direction;
  if (direction === "rtl") {
    el.classList.add("venext-rtl");
  } else {
    el.classList.remove("venext-rtl");
  }
  return direction;
}
