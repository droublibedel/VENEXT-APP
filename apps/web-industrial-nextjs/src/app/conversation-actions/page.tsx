import Link from "next/link";

export default function ConversationActionsPage() {
  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/90">conversation-actions</p>
      <h1 className="mt-2 text-xl font-semibold">Rail d’actions opérationnelles</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Dans un fil actif, le <strong className="text-slate-200">CommerceActionRail</strong> propose prix,
        quantité, réservation, livraison, paiement, facture, acceptation partielle et conversion panier — rendu
        à droite sur bureau, en bandeau sur mobile.
      </p>
      <Link className="mt-6 inline-block text-sm text-cyan-400 hover:underline" href="/commerce-messaging">
        Ouvrir un fil démo
      </Link>
    </div>
  );
}
