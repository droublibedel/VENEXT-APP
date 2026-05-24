import type { CommerceNotificationPreferences } from "./commerce-notifications.types";
import { getNotificationTranslation } from "./commerce-notifications-i18n";

type Props = {
  preferences: CommerceNotificationPreferences;
  locale?: string;
  onChange: (patch: Partial<CommerceNotificationPreferences>) => void;
};

const ROWS: { key: keyof CommerceNotificationPreferences; labelKey: string }[] = [
  { key: "orders", labelKey: "notifications.prefs.orders" },
  { key: "deliveries", labelKey: "notifications.prefs.deliveries" },
  { key: "settlements", labelKey: "notifications.prefs.settlements" },
  { key: "messages", labelKey: "notifications.prefs.messages" },
  { key: "mails", labelKey: "notifications.prefs.mails" },
  { key: "relations", labelKey: "notifications.prefs.relations" },
  { key: "catalogs", labelKey: "notifications.prefs.catalogs" },
  { key: "walletSecurity", labelKey: "notifications.prefs.wallet" },
  { key: "sponsoredCatalogs", labelKey: "notifications.prefs.sponsored" },
];

export function CommerceNotificationPreferencesPanel({
  preferences,
  locale = "fr-CI",
  onChange,
}: Props) {
  return (
    <div data-testid="cn-preferences" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 15, color: "var(--venext-text, #17201c)" }}>
        {getNotificationTranslation("notifications.preferences", locale)}
      </h3>
      {ROWS.map(({ key, labelKey }) => (
        <label
          key={key}
          style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#b8c9c0" }}
        >
          <input
            type="checkbox"
            checked={preferences[key]}
            onChange={(e) => onChange({ [key]: e.target.checked })}
          />
          {getNotificationTranslation(labelKey, locale)}
        </label>
      ))}
    </div>
  );
}
