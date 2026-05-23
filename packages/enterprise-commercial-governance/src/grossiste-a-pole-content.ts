import type { GrossisteACanonicalPole } from "./grossiste-a-canonical-poles";
import { GROSSISTE_A_CANONICAL_POLES } from "./grossiste-a-canonical-poles";

export type GrossisteAPoleSignal = {
  id: string;
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "attention";
  crossPoleRefs?: GrossisteACanonicalPole[];
};

export type GrossisteAPoleAction = {
  id: string;
  label: string;
  targetWorkspace?: string;
};

export type GrossisteAPoleBusinessContent = {
  pole: GrossisteACanonicalPole;
  title: string;
  subtitle: string;
  signals: GrossisteAPoleSignal[];
  actions: GrossisteAPoleAction[];
  minSignals: number;
};

const FORBIDDEN_KPI = /^(kpi|metric|stat|total users|revenue global|nps|churn)$/i;

const POLE_CONTENT: Record<GrossisteACanonicalPole, GrossisteAPoleBusinessContent> = {
  PILOTAGE_COMMERCIAL: {
    pole: "PILOTAGE_COMMERCIAL",
    title: "Pilotage commercial",
    subtitle: "Activité réseau, commandes et règlements en un coup d'œil",
    minSignals: 4,
    signals: [
      { id: "pc-partners", label: "Activité partenaires", value: "—", crossPoleRefs: ["RESEAU_DISTRIBUTION"] },
      { id: "pc-pending-orders", label: "Commandes en attente", value: "—", crossPoleRefs: ["COMMANDES_ADV"] },
      { id: "pc-rotation", label: "Produits forte rotation", value: "—", crossPoleRefs: ["RESEAU_DISTRIBUTION"] },
      { id: "pc-inactive", label: "Partenaires inactifs", value: "—", tone: "attention" },
      { id: "pc-weak-zones", label: "Zones commerciales faibles", value: "—", tone: "attention" },
      { id: "pc-strong-zones", label: "Zones dynamiques", value: "—", tone: "positive" },
      { id: "pc-settlements", label: "Règlements attendus", value: "—", crossPoleRefs: ["FINANCE_REGLEMENTS"] },
      { id: "pc-network", label: "Activité réseau", value: "—", crossPoleRefs: ["RESEAU_DISTRIBUTION"] },
    ],
    actions: [
      { id: "pc-act", label: "Voir l'activité réseau", targetWorkspace: "network" },
      { id: "pc-slow", label: "Suivre ralentissements", targetWorkspace: "orders" },
      { id: "pc-partner", label: "Ouvrir un partenaire", targetWorkspace: "commerce-messaging" },
    ],
  },
  RESEAU_DISTRIBUTION: {
    pole: "RESEAU_DISTRIBUTION",
    title: "Réseau & distribution",
    subtitle: "Circulation commerciale terrain — pas de réseau social",
    minSignals: 4,
    signals: [
      { id: "rd-gb", label: "Activité grossistes B", value: "—" },
      { id: "rd-retail", label: "Activité détaillants", value: "—" },
      { id: "rd-flow", label: "Circulation produits", value: "—" },
      { id: "rd-stock", label: "Disponibilité produits", value: "—" },
      { id: "rd-zones", label: "Zones actives", value: "—" },
      { id: "rd-coverage", label: "Couverture réseau", value: "—" },
      { id: "rd-rupture", label: "Ruptures terrain", value: "—", tone: "attention" },
    ],
    actions: [
      { id: "rd-map", label: "Voir couverture", targetWorkspace: "territory" },
      { id: "rd-catalog", label: "Catalogue relationnel", targetWorkspace: "catalog" },
    ],
  },
  COMMANDES_ADV: {
    pole: "COMMANDES_ADV",
    title: "Commandes & ADV",
    subtitle: "Flux commerciaux — validation et suivi",
    minSignals: 4,
    signals: [
      { id: "ca-pending", label: "Commandes en attente", value: "—", crossPoleRefs: ["PILOTAGE_COMMERCIAL"] },
      { id: "ca-validated", label: "Commandes validées", value: "—" },
      { id: "ca-blocked", label: "Commandes bloquées", value: "—", tone: "attention" },
      { id: "ca-prep", label: "Suivi préparation", value: "—" },
      { id: "ca-late", label: "Commandes retardées", value: "—", crossPoleRefs: ["LIVRAISON_RECEPTION"], tone: "attention" },
      { id: "ca-urgent", label: "Commandes urgentes", value: "—", tone: "attention" },
    ],
    actions: [
      { id: "ca-validate", label: "Valider une commande", targetWorkspace: "orders" },
      { id: "ca-track", label: "Suivre commande", targetWorkspace: "orders" },
      { id: "ca-delivery", label: "Ouvrir livraison", targetWorkspace: "distribution" },
    ],
  },
  LIVRAISON_RECEPTION: {
    pole: "LIVRAISON_RECEPTION",
    title: "Livraison & réception",
    subtitle: "Suivi terrain simple",
    minSignals: 3,
    signals: [
      { id: "lr-progress", label: "Livraisons en cours", value: "—" },
      { id: "lr-received", label: "Réceptions confirmées", value: "—" },
      { id: "lr-late", label: "Livraisons retardées", value: "—", crossPoleRefs: ["COMMANDES_ADV"], tone: "attention" },
      { id: "lr-zones", label: "Zones livraison", value: "—" },
      { id: "lr-drivers", label: "Activité livreurs", value: "—" },
    ],
    actions: [
      { id: "lr-map", label: "Voir distribution", targetWorkspace: "distribution" },
    ],
  },
  FINANCE_REGLEMENTS: {
    pole: "FINANCE_REGLEMENTS",
    title: "Finance & règlements",
    subtitle: "Règlements relationnels — pas de banque",
    minSignals: 3,
    signals: [
      { id: "fr-expected", label: "Règlements attendus", value: "—", crossPoleRefs: ["PILOTAGE_COMMERCIAL"] },
      { id: "fr-received", label: "Règlements reçus", value: "—", tone: "positive" },
      { id: "fr-pending", label: "En attente", value: "—" },
      { id: "fr-late", label: "Partenaires en retard", value: "—", tone: "attention" },
      { id: "fr-wallet", label: "Activité wallet relationnel", value: "—" },
    ],
    actions: [
      { id: "fr-settle", label: "Voir règlement", targetWorkspace: "commerce-wallet" },
      { id: "fr-partner", label: "Ouvrir partenaire", targetWorkspace: "commerce-messaging" },
    ],
  },
  RELATIONS_PARTENAIRES: {
    pole: "RELATIONS_PARTENAIRES",
    title: "Relations partenaires",
    subtitle: "Gouvernance commerciale relationnelle",
    minSignals: 3,
    signals: [
      { id: "rp-active", label: "Relations actives", value: "—" },
      { id: "rp-pending", label: "Demandes partenaires", value: "—" },
      { id: "rp-suspended", label: "Partenaires suspendus", value: "—", tone: "attention" },
      { id: "rp-new", label: "Récemment activés", value: "—", tone: "positive" },
    ],
    actions: [
      { id: "rp-msg", label: "Messagerie relationnelle", targetWorkspace: "commerce-messaging" },
    ],
  },
  SECURITE_GOUVERNANCE: {
    pole: "SECURITE_GOUVERNANCE",
    title: "Sécurité & gouvernance",
    subtitle: "Accès internes entreprise — jamais super-admin VENEXT",
    minSignals: 3,
    signals: [
      { id: "sg-active", label: "Collaborateurs actifs", value: "—" },
      { id: "sg-suspended", label: "Utilisateurs suspendus", value: "—" },
      { id: "sg-devices", label: "Appareils de confiance", value: "—" },
      { id: "sg-invites", label: "Invitations actives", value: "—" },
    ],
    actions: [{ id: "sg-gov", label: "Historique gouvernance", targetWorkspace: "governance" }],
  },
};

export function getGrossisteAPoleBusinessContent(pole: GrossisteACanonicalPole): GrossisteAPoleBusinessContent {
  return { ...POLE_CONTENT[pole], signals: [...POLE_CONTENT[pole].signals] };
}

export function listGrossisteAPoleBusinessContents(): GrossisteAPoleBusinessContent[] {
  return GROSSISTE_A_CANONICAL_POLES.map((p) => getGrossisteAPoleBusinessContent(p));
}

export function hydratePoleSignals(
  pole: GrossisteACanonicalPole,
  values: Partial<Record<string, string>>,
): GrossisteAPoleBusinessContent {
  const base = getGrossisteAPoleBusinessContent(pole);
  return {
    ...base,
    signals: base.signals.map((s) => ({
      ...s,
      value: values[s.id] ?? s.value,
    })),
  };
}

export function isDecorativeKpi(label: string): boolean {
  return FORBIDDEN_KPI.test(label.trim()) || label.trim().length < 4;
}

export function poleContentMeetsMinimum(content: GrossisteAPoleBusinessContent): boolean {
  return (
    content.signals.length >= content.minSignals &&
    content.actions.length > 0 &&
    content.signals.every((s) => s.label.trim().length >= 4 && !isDecorativeKpi(s.label))
  );
}
