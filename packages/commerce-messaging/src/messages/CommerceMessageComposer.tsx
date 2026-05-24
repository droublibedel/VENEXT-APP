import { memo, useState } from "react";

import type { ResolvedConversationGovernance } from "../governance/commerce-conversation-governance.types";
import { COMPOSER_QUICK_SUGGESTIONS } from "../intelligence/commerce-messaging-intelligence";
import { VenextVoiceRecorder, type VoiceRecordingResult } from "../voice/VenextVoiceRecorder.js";

export const CommerceMessageComposer = memo(function CommerceMessageComposer({
  onSend,
  onSendVoice,
  testId = "cm-message-composer",
  quickSuggestions,
  governance,
  variant = "default",
  terrainMode = false,
}: {
  onSend?: (text: string) => void;
  onSendVoice?: (result: VoiceRecordingResult) => void;
  testId?: string;
  quickSuggestions?: readonly string[];
  governance?: ResolvedConversationGovernance | null;
  /** Mobile grossiste: compact composer, horizontal suggestions, 44px touch targets. */
  variant?: "default" | "mobile";
  /** Vocal central, micro accessible */
  terrainMode?: boolean;
}) {
  const [text, setText] = useState("");

  if (governance && !governance.composerVisible) {
    return (
      <p
        data-testid="cm-composer-hidden"
        style={{ padding: "12px 16px", margin: 0, fontSize: 12, color: "#526059" }}
      >
        {governance.mode === "PARTNER_ONLY" && !governance.partnerAuthorized
          ? "Conversation réservée aux partenaires autorisés."
          : "Discussion désactivée pour ce contexte commercial."}
      </p>
    );
  }

  const suggestions =
    governance?.composerSuggestions.length
      ? governance.composerSuggestions
      : (quickSuggestions ?? COMPOSER_QUICK_SUGGESTIONS);

  const isMobile = variant === "mobile";

  return (
    <div
      className={`cm-composer${isMobile ? " cm-composer--mobile" : ""}`}
      data-testid={testId}
      data-variant={variant}
    >
      <div
        className={isMobile ? "cm-composer-suggestions-scroll" : undefined}
        style={
          isMobile
            ? undefined
            : { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }
        }
      >
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className={`cm-chip${isMobile ? " cm-chip--touch" : ""}`}
            data-testid={`cm-suggestion-${s.replace(/\s/g, "-").toLowerCase()}`}
            onClick={() => setText(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="cm-composer-row" style={{ alignItems: "flex-end", gap: 8 }}>
        {terrainMode || isMobile ? (
          <VenextVoiceRecorder
            onRecorded={(r) => onSendVoice?.(r)}
            testId="cm-composer-voice"
          />
        ) : null}
        <textarea
          className="cm-input"
          rows={isMobile ? 1 : 2}
          placeholder="Message commercial…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid="cm-composer-input"
          aria-label="Composer message"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          data-testid="cm-composer-send"
          onClick={() => {
            if (text.trim()) {
              onSend?.(text.trim());
              setText("");
            }
          }}
          style={{
            minHeight: 44,
            minWidth: 44,
            padding: "0 16px",
            borderRadius: 12,
            background: "#00A884",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Envoyer
        </button>
      </div>
      {!isMobile ? (
        <p style={{ margin: "8px 0 0", fontSize: 10, color: "#66746D" }}>
          Attacher produit · commande · activité (fondation)
        </p>
      ) : null}
    </div>
  );
});
