import { memo } from "react";

import type {
  CommerceMessagingAccountSettings,
  ConversationMode,
} from "./commerce-conversation-governance.types";

const MODE_OPTIONS: { value: ConversationMode; label: string }[] = [
  { value: "NEGOTIABLE", label: "Négociation autorisée" },
  { value: "FIXED_PRICE_ONLY", label: "Prix fixe uniquement" },
  { value: "PARTNER_ONLY", label: "Partenaires autorisés" },
];

export const CommerceMessagingAccountSettingsPanel = memo(
  function CommerceMessagingAccountSettingsPanel({
    settings,
    onChange,
    testId = "cm-account-governance",
  }: {
    settings: CommerceMessagingAccountSettings;
    onChange?: (next: CommerceMessagingAccountSettings) => void;
    testId?: string;
  }) {
    const set = (patch: Partial<CommerceMessagingAccountSettings>) =>
      onChange?.({ ...settings, ...patch });

    return (
      <section
        className="cm-context-card"
        data-testid={testId}
        style={{ margin: "8px 16px", padding: 12 }}
      >
        <p style={{ margin: 0, fontSize: 11, color: "#8fa39a", textTransform: "uppercase" }}>
          Messagerie commerciale
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={settings.messagingEnabled}
            data-testid="cm-governance-messaging-enabled"
            onChange={(e) => set({ messagingEnabled: e.target.checked })}
          />
          Activer la messagerie
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={!settings.messagingEnabled}
            data-testid="cm-governance-messaging-disabled"
            onChange={(e) => set({ messagingEnabled: !e.target.checked })}
          />
          Désactiver la messagerie
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={settings.defaultMode === "FIXED_PRICE_ONLY"}
            data-testid="cm-governance-fixed-price"
            onChange={(e) =>
              set({ defaultMode: e.target.checked ? "FIXED_PRICE_ONLY" : "NEGOTIABLE" })
            }
          />
          Mode prix fixe
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={settings.defaultMode === "NEGOTIABLE"}
            data-testid="cm-governance-negotiation"
            onChange={(e) =>
              set({ defaultMode: e.target.checked ? "NEGOTIABLE" : settings.defaultMode })
            }
          />
          Mode négociation
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={settings.partnersOnly}
            data-testid="cm-governance-partners-only"
            onChange={(e) => set({ partnersOnly: e.target.checked })}
          />
          Partenaires autorisés uniquement
        </label>
        {settings.messagingEnabled ? (
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#6b8078" }}>
            Mode actuel :{" "}
            {MODE_OPTIONS.find((o) => o.value === settings.defaultMode)?.label ?? settings.defaultMode}
          </p>
        ) : (
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#6b8078" }}>
            Les commandes restent possibles sans discussion.
          </p>
        )}
      </section>
    );
  },
);
