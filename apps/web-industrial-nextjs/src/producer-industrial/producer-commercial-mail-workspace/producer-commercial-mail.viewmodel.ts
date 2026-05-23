import { buildCommerceLinkedContext } from "commerce-messaging";

import type {
  ProducerAlertDto,
  ProducerCommercialNetworkDto,
  ProducerFinanceCollectionsDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerProductTrendDto,
} from "../data/producer-industrial-data.types";
import { buildOrderRows } from "../order-fulfillment-workspace/producer-order-fulfillment.viewmodel";
import type {
  ProducerCommercialMailView,
  ProducerMailAttachment,
  ProducerMailFolderId,
  ProducerMailThread,
} from "./producer-commercial-mail.types";

function partnerEmail(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
  return `${slug || "partenaire"}@reseau-partenaire.ci`;
}

function attachment(
  id: string,
  name: string,
  kind: ProducerMailAttachment["kind"],
): ProducerMailAttachment {
  const sizes: Record<ProducerMailAttachment["kind"], string> = {
    pdf: "240 Ko",
    xlsx: "88 Ko",
    docx: "120 Ko",
    csv: "34 Ko",
    png: "1,2 Mo",
    jpg: "890 Ko",
  };
  return {
    id,
    name,
    kind,
    sizeLabel: sizes[kind],
    at: "Aujourd'hui",
    activityLabel: "Document commercial",
  };
}

function buildThread(input: {
  id: string;
  folder: ProducerMailFolderId;
  subject: string;
  partnerName: string;
  partnerId?: string;
  preview: string;
  body: string;
  at: string;
  priority?: "normal" | "high";
  unread?: boolean;
  orderId?: string;
  orderReference?: string;
  settlementReference?: string;
  productNames?: string[];
  attachments?: ProducerMailAttachment[];
}): ProducerMailThread {
  const from = { name: input.partnerName, email: partnerEmail(input.partnerName), role: "Partenaire réseau" };
  const to = [{ name: "Direction commerciale", email: "commercial@producteur-industriel.ci" }];
  const linkedContext =
    input.orderId || input.settlementReference
      ? buildCommerceLinkedContext({
          conversationId: input.id,
          partnerName: input.partnerName,
          partnerId: input.partnerId,
          city: "Abidjan",
          productName: input.productNames?.[0],
          order: input.orderId
            ? {
                orderId: input.orderId,
                partner: input.partnerName,
                status: "En validation",
                preparation: "Planifiée",
                delivery: "À confirmer",
                amountLabel: input.orderReference ?? "—",
              }
            : null,
          settlement: input.settlementReference
            ? {
                method: "bank-transfer",
                statusLabel: "Virement en attente",
                amountLabel: input.orderReference ?? "—",
                reference: input.settlementReference,
              }
            : null,
        })
      : null;

  return {
    id: input.id,
    folder: input.folder,
    subject: input.subject,
    preview: input.preview,
    partnerName: input.partnerName,
    partnerId: input.partnerId,
    from,
    to,
    at: input.at,
    priority: input.priority ?? "normal",
    unread: input.unread ?? false,
    starred: input.priority === "high",
    hasAttachments: Boolean(input.attachments?.length),
    orderId: input.orderId,
    orderReference: input.orderReference,
    settlementReference: input.settlementReference,
    productNames: input.productNames,
    messages: [
      {
        id: `${input.id}-m1`,
        threadId: input.id,
        from,
        to,
        subject: input.subject,
        body: input.body,
        at: input.at,
        attachments: input.attachments ?? [],
      },
    ],
    linkedContext,
  };
}

export function buildProducerCommercialMailView(input: {
  commercial: ProducerCommercialNetworkDto | null;
  orders: ProducerOrderSummaryDto | null;
  finance: ProducerFinanceCollectionsDto | null;
  network: ProducerNetworkActivityDto | null;
  products: ProducerProductTrendDto[] | null;
  alerts: ProducerAlertDto[] | null;
}): ProducerCommercialMailView {
  const partners = [
    ...(input.commercial?.topWholesalers ?? []),
    ...(input.commercial?.recentPartners ?? []),
  ]
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      name: p.name,
      email: partnerEmail(p.name),
    }));

  const orderRows = buildOrderRows(input.commercial);
  const orders = orderRows.slice(0, 12).map((o) => ({
    id: o.id,
    reference: o.reference,
    partner: o.partner,
    amountLabel: `${o.volume.toLocaleString("fr-FR")} unités`,
  }));

  const settlements = (input.finance?.atRiskPartnerList ?? input.commercial?.topWholesalers ?? [])
    .slice(0, 6)
    .map((p, i) => ({
      id: `stl-${p.id}`,
      reference: `VIR-${p.id.toUpperCase()}-${1000 + i}`,
      partner: p.name,
      amountLabel: `${Math.round(p.revenueXof / 10).toLocaleString("fr-FR")} FCFA`,
      method: "bank-transfer",
    }));

  const productList = (input.products ?? []).slice(0, 8).map((p) => ({ id: p.id, name: p.name }));

  const w1 = input.commercial?.topWholesalers[0];
  const w2 = input.commercial?.topWholesalers[1];
  const p1 = input.products?.[0];

  const threads: ProducerMailThread[] = [
    buildThread({
      id: "mail-1",
      folder: "inbox",
      subject: "Validation commande réseau — corridor Abidjan",
      partnerName: w1?.name ?? "Grossiste Ouest",
      partnerId: w1?.id,
      preview: "Bonjour, merci de confirmer la validation de la commande réseau jointe.",
      body: "Bonjour,\n\nMerci de confirmer la validation de la commande réseau jointe. Le document PDF reprend les quantités et le créneau de livraison souhaité.\n\nCordialement,\nÉquipe partenaire",
      at: "Aujourd'hui 09:12",
      priority: "high",
      unread: true,
      orderId: orders[0]?.id,
      orderReference: orders[0]?.reference,
      productNames: p1 ? [p1.name] : undefined,
      attachments: [attachment("att-1", "commande-reseau.pdf", "pdf"), attachment("att-2", "quantites.xlsx", "xlsx")],
    }),
    buildThread({
      id: "mail-2",
      folder: "orders",
      subject: "Confirmation livraison — référence commande",
      partnerName: w2?.name ?? "Semi-grossiste Nord",
      partnerId: w2?.id,
      preview: "La livraison est confirmée pour la semaine en cours.",
      body: "Bonjour,\n\nLa livraison est confirmée pour la semaine en cours. Veuillez trouver le bon de préparation en pièce jointe.\n\nBien à vous",
      at: "Hier 16:40",
      orderId: orders[1]?.id,
      orderReference: orders[1]?.reference,
      attachments: [attachment("att-3", "bon-preparation.docx", "docx")],
    }),
    buildThread({
      id: "mail-3",
      folder: "settlements",
      subject: "Virement bancaire — règlement partenaire",
      partnerName: settlements[0]?.partner ?? "Partenaire réseau",
      preview: "Référence virement transmise pour le règlement commercial.",
      body: "Bonjour,\n\nNous avons initié le virement bancaire selon les conditions convenues. Référence en pièce jointe.\n\nService finance partenaire",
      at: "Hier 11:05",
      settlementReference: settlements[0]?.reference,
      attachments: [attachment("att-4", "avis-virement.pdf", "pdf")],
    }),
    buildThread({
      id: "mail-4",
      folder: "documents",
      subject: "Facture proforma — produits catalogue",
      partnerName: w1?.name ?? "Grossiste Ouest",
      preview: "Facture proforma et fiche produit en pièces jointes.",
      body: "Bonjour,\n\nVeuillez trouver la facture proforma et la fiche produit demandée.\n\nCordialement",
      at: "Lun. 14:20",
      productNames: productList.slice(0, 2).map((p) => p.name),
      attachments: [
        attachment("att-5", "facture-proforma.pdf", "pdf"),
        attachment("att-6", "fiche-produit.png", "png"),
      ],
    }),
    buildThread({
      id: "mail-5",
      folder: "network",
      subject: "Activité réseau — point hebdomadaire",
      partnerName: "Coordination réseau",
      preview: "Synthèse d'activité réseau et export CSV joints.",
      body: "Bonjour,\n\nCi-joint la synthèse d'activité réseau de la semaine.\n\nÉquipe coordination",
      at: "Dim. 10:00",
      attachments: [attachment("att-7", "activite-reseau.csv", "csv")],
    }),
    buildThread({
      id: "mail-6",
      folder: "sent",
      subject: "RE: Conditions commerciales Q2",
      partnerName: "Direction commerciale",
      preview: "Réponse envoyée — conditions commerciales validées.",
      body: "Merci pour votre retour. Les conditions Q2 sont validées côté producteur.\n\nDirection commerciale",
      at: "Ven. 17:30",
      unread: false,
    }),
    buildThread({
      id: "mail-7",
      folder: "priority",
      subject: "URGENT — incident corridor nord",
      partnerName: w2?.name ?? "Semi-grossiste Nord",
      preview: "Incident logistique sur le corridor nord — action requise.",
      body: "Bonjour,\n\nUn incident logistique impacte le corridor nord. Merci de nous indiquer une décision sous 24h.\n\nUrgent — équipe terrain",
      at: "Aujourd'hui 07:50",
      priority: "high",
      unread: true,
    }),
    buildThread({
      id: "mail-8",
      folder: "archived",
      subject: "Archives — clôture activité mars",
      partnerName: "Archives réseau",
      preview: "Dossier clôturé — conservé pour référence.",
      body: "Dossier d'activité clôturé et archivé pour référence commerciale.",
      at: "01 mars",
      unread: false,
    }),
  ];

  return {
    threads,
    drafts: [],
    partners,
    products: productList,
    orders,
    settlements,
    activitySummary:
      input.network != null
        ? `Réseau actif — ${input.network.activePartners} partenaires · ${input.network.orders7d} commandes / 7j`
        : "Activité réseau commerciale régulière.",
  };
}

export function filterThreadsByFolder(
  threads: ProducerMailThread[],
  folder: ProducerMailFolderId,
): ProducerMailThread[] {
  if (folder === "inbox") return threads.filter((t) => t.folder === "inbox" || t.unread);
  if (folder === "priority") return threads.filter((t) => t.priority === "high" || t.starred);
  return threads.filter((t) => t.folder === folder);
}
