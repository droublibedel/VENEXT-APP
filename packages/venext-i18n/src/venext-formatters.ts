import type { VenextLocale } from "./venext-i18n.types";

export type VenextFormatterSet = {
  currencyXof: (amount: number) => string;
  dateShort: (date: Date | string | number) => string;
  dateLong: (date: Date | string | number) => string;
  time: (date: Date | string | number) => string;
  number: (value: number) => string;
  quantity: (value: number, unit?: string) => string;
  percent: (value: number) => string;
};

function toDate(input: Date | string | number): Date {
  return input instanceof Date ? input : new Date(input);
}

const CURRENCY_BY_LOCALE: Record<VenextLocale, { locale: string; suffix: string }> = {
  "fr-CI": { locale: "fr-CI", suffix: "FCFA" },
  en: { locale: "en", suffix: "XOF" },
  ar: { locale: "ar", suffix: "فرنك CFA" },
  "zh-CN": { locale: "zh-CN", suffix: "西非法郎" },
};

export function createVenextFormatters(locale: VenextLocale): VenextFormatterSet {
  const { locale: intlLocale, suffix } = CURRENCY_BY_LOCALE[locale];

  const currencyXof = (amount: number): string => {
    const formatted = new Intl.NumberFormat(intlLocale, {
      maximumFractionDigits: 0,
    }).format(amount);
    if (locale === "ar") return `${formatted} ${suffix}`;
    if (locale === "zh-CN") return `${formatted} ${suffix}`;
    if (locale === "en") return `${formatted} ${suffix}`;
    return `${formatted} ${suffix}`;
  };

  const dateShort = (input: Date | string | number): string =>
    new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" }).format(toDate(input));

  const dateLong = (input: Date | string | number): string =>
    new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(toDate(input));

  const time = (input: Date | string | number): string =>
    new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit" }).format(toDate(input));

  const number = (value: number): string =>
    new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2 }).format(value);

  const quantity = (value: number, unit = ""): string => {
    const base = number(value);
    return unit ? `${base} ${unit}` : base;
  };

  const percent = (value: number): string =>
    new Intl.NumberFormat(intlLocale, { style: "percent", maximumFractionDigits: 0 }).format(
      value / 100,
    );

  return { currencyXof, dateShort, dateLong, time, number, quantity, percent };
}
