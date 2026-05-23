import type { ProfessionalNetworkView, ProfessionalPartner } from "./professional-commercial-network.types";

export function buildProfessionalNetworkView(
  actorRole: "producteur" | "grossiste_a",
): ProfessionalNetworkView {
  const isProducer = actorRole === "producteur";
  const partners: ProfessionalPartner[] = [
    {
      id: "pp-1",
      companyName: isProducer ? "Grossiste Ouest SA" : "Producteur Agro Ouest",
      contactName: isProducer ? "Direction commerciale Ouest" : "Direction industrielle",
      activityType: isProducer ? "Grossiste structuré" : "Producteur industriel",
      city: "Abidjan",
      status: "active",
      coverageLabel: "Corridor sud · 4 villes",
      productCategories: ["Boissons", "Farine", "Huile"],
      stabilityLabel: "Stable",
      lastActivity: "Aujourd'hui",
      restrictedCatalog: true,
    },
    {
      id: "pp-2",
      companyName: isProducer ? "Semi-grossiste Nord" : "Producteur Nord Céréales",
      contactName: "Service approvisionnement",
      activityType: isProducer ? "Semi-grossiste" : "Producteur",
      city: "Bouaké",
      status: "pending_validation",
      coverageLabel: "Nord · 2 corridors",
      productCategories: ["Riz", "Farine"],
      stabilityLabel: "Sous revue",
      lastActivity: "Hier",
      restrictedCatalog: true,
    },
    {
      id: "pp-3",
      companyName: isProducer ? "Distribution Korhogo" : "Agro Industrie Korhogo",
      contactName: "Responsable réseau",
      activityType: "Partenaire distribution",
      city: "Korhogo",
      status: "invited",
      coverageLabel: "Invitation envoyée",
      productCategories: ["Conserves"],
      stabilityLabel: "—",
      lastActivity: "En attente",
      restrictedCatalog: true,
    },
    {
      id: "pp-4",
      companyName: isProducer ? "Grossiste San Pedro" : "Producteur Port Ouest",
      contactName: "Commercial export",
      activityType: "Grossiste",
      city: "San Pedro",
      status: "active",
      coverageLabel: "Littoral",
      productCategories: ["Boissons", "Hygiène"],
      stabilityLabel: "Actif",
      lastActivity: "Hier",
      restrictedCatalog: true,
    },
    {
      id: "pp-5",
      companyName: isProducer ? "Réseau Yamoussoukro" : "Industrie Centre",
      contactName: "Coordination B2B",
      activityType: "Distributeur",
      city: "Yamoussoukro",
      status: "suspended",
      coverageLabel: "Pause commerciale",
      productCategories: ["Farine"],
      stabilityLabel: "Suspendu",
      lastActivity: "Il y a 2 semaines",
      restrictedCatalog: true,
    },
  ];

  return {
    partners,
    closedNetworkNotice:
      "Réseau fermé — catalogues et échanges visibles uniquement pour les partenaires validés.",
    documents: [
      { id: "doc-1", name: "Accord distribution 2026.pdf", kind: "pdf", sizeLabel: "420 Ko", at: "Aujourd'hui", category: "Accord" },
      { id: "doc-2", name: "Grille tarifaire.xlsx", kind: "xlsx", sizeLabel: "88 Ko", at: "Hier", category: "Tarifs" },
      { id: "doc-3", name: "Bon commande CMD-2401.pdf", kind: "pdf", sizeLabel: "120 Ko", at: "Hier", category: "Commande" },
      { id: "doc-4", name: "Facture proforma.docx", kind: "docx", sizeLabel: "95 Ko", at: "Lun.", category: "Facture" },
    ],
    mailThreads: [
      {
        id: "mail-1",
        subject: "Validation commande réseau — corridor Abidjan",
        partnerId: "pp-1",
        at: "Aujourd'hui 09:12",
        preview: "Merci de confirmer la validation de la commande réseau jointe.",
        orderReference: "CMD-2401",
      },
      {
        id: "mail-2",
        subject: "Virement bancaire — règlement partenaire",
        partnerId: "pp-1",
        at: "Hier 11:05",
        preview: "Référence virement transmise pour le règlement commercial.",
        settlementReference: "VIR-PP1-1042",
      },
    ],
    orders: [
      { id: "o-1", reference: "CMD-2401", status: "En validation", amountLabel: "12 400 unités" },
      { id: "o-2", reference: "CMD-2398", status: "Confirmée", amountLabel: "8 200 unités" },
    ],
    settlements: [
      { id: "s-1", reference: "VIR-PP1-1042", amountLabel: "4 820 000 FCFA", method: "Virement bancaire" },
      { id: "s-2", reference: "VIR-PP1-1038", amountLabel: "2 100 000 FCFA", method: "Virement bancaire" },
    ],
    territory: {
      cities: ["Abidjan", "Bouaké", "Korhogo", "San Pedro"],
      corridors: ["Corridor sud", "Axe nord", "Littoral ouest"],
      activeZones: ["Plateau", "Treichville", "Zone industrielle"],
      stabilityNote: "Couverture réseau stable sur les corridors principaux.",
    },
    agreements: [
      { id: "agr-1", label: "Conditions générales distribution 2026", status: "active", validUntil: "31 déc. 2026" },
      { id: "agr-2", label: "Avenant volumes Q2", status: "review" },
    ],
    activitySummary: "Activité commerciale B2B régulière — relations validées uniquement.",
  };
}

export function filterPartnersByStatus(
  partners: ProfessionalPartner[],
  status?: ProfessionalPartner["status"],
): ProfessionalPartner[] {
  if (!status) return partners;
  return partners.filter((p) => p.status === status);
}
