import Link from "next/link";

export default function NegotiationEngineDocsPage() {
  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300/90">negotiation-engine</p>
      <h1 className="mt-2 text-xl font-semibold">API moteur de négociation</h1>
      <ul className="mt-4 list-inside list-disc space-y-1 font-mono text-[11px] text-slate-400">
        <li>POST /api/core/v1/negotiation-engine/:id/propose-price</li>
        <li>POST /api/core/v1/negotiation-engine/:id/propose-quantity</li>
        <li>POST /api/core/v1/negotiation-engine/:id/accept</li>
        <li>POST /api/core/v1/negotiation-engine/:id/reject</li>
        <li>POST /api/core/v1/negotiation-engine/:id/reservation-intent</li>
        <li>POST /api/core/v1/negotiation-engine/:id/convert-to-cart</li>
      </ul>
      <Link className="mt-6 inline-block text-sm text-cyan-400 hover:underline" href="/commerce-messaging">
        Retour hub
      </Link>
    </div>
  );
}
