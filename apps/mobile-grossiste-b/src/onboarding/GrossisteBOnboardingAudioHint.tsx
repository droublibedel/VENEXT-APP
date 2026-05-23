import { memo } from "react";
import { BusinessProfileAudioSection } from "terrain-commercial-audio";

/** Carte douce post-inscription — non bloquante (GROSSISTE-B-03). */
export const GrossisteBOnboardingAudioHint = memo(function GrossisteBOnboardingAudioHint({
  ownerActorId,
  onDismiss,
}: {
  ownerActorId: string;
  onDismiss?: () => void;
}) {
  return (
    <article
      className="grossiste-b-card"
      data-testid="gb-onboarding-audio-hint"
      style={{ marginTop: 16 }}
    >
      <p style={{ margin: "0 0 8px", fontSize: 13, color: "#00a884" }}>
        Présentez votre activité en audio
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 11, color: "#8fa39a" }}>
        Optionnel — vous pourrez aussi le faire plus tard dans votre profil.
      </p>
      <BusinessProfileAudioSection ownerActorId={ownerActorId} />
      {onDismiss ? (
        <button
          type="button"
          data-testid="gb-onboarding-audio-skip"
          onClick={onDismiss}
          style={{ marginTop: 12, fontSize: 12, color: "#8fa39a", background: "none", border: "none" }}
        >
          Plus tard
        </button>
      ) : null}
    </article>
  );
});
