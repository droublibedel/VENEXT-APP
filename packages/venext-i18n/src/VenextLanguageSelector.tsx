import { memo, useCallback, type ChangeEvent } from "react";

import type { VenextLocale } from "./venext-i18n.types";
import { VENEXT_LOCALES } from "./venext-i18n.types";
import { useVenextLocale, useVenextT } from "./venext-locale-provider";

const LOCALE_LABEL_KEYS: Record<VenextLocale, "language.fr" | "language.en" | "language.ar" | "language.zh"> = {
  "fr-CI": "language.fr",
  en: "language.en",
  ar: "language.ar",
  "zh-CN": "language.zh",
};

export const VenextLanguageSelector = memo(function VenextLanguageSelector({
  className,
  testId = "venext-language-selector",
}: {
  className?: string;
  testId?: string;
}) {
  const { locale, setLocale } = useVenextLocale();
  const t = useVenextT();

  const onChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setLocale(e.target.value as VenextLocale);
    },
    [setLocale],
  );

  return (
    <label className={className} data-testid={testId} style={{ display: "block", fontSize: 13 }}>
      <span style={{ display: "block", marginBottom: 6, color: "#8fa39a" }}>{t("language.label")}</span>
      <select
        value={locale}
        onChange={onChange}
        data-testid={`${testId}-select`}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #2a3530",
          background: "#121816",
          color: "#e8f0ec",
          fontSize: 14,
        }}
      >
        {VENEXT_LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {t(LOCALE_LABEL_KEYS[loc])}
          </option>
        ))}
      </select>
    </label>
  );
});
