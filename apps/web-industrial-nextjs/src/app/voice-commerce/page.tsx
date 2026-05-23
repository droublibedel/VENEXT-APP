import Link from "next/link";

export default function VoiceCommercePage() {
  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/90">voice-commerce</p>
      <h1 className="mt-2 text-xl font-semibold">Voix — commerce prioritaire</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Les bulles <strong className="text-slate-200">VoiceMessageBubble</strong> simulent forme d’onde,
        vitesses 1×–1.5× et lecture progressive. Côté serveur, les médias restent des URLs démo ; la compression
        adaptive (Opus / chunks) se branche sur le pipeline média sans changer l’UI.
      </p>
      <Link
        className="mt-6 inline-block text-sm text-cyan-400 hover:underline"
        href="/commerce-messaging/91111111-1111-1111-1111-111111111001"
      >
        Voir notes vocales dans le fil matière
      </Link>
    </div>
  );
}
