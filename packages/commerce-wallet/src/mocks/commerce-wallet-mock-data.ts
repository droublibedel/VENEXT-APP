import type {
  CommercePartnerPayment,
  CommercePaymentActivity,
  CommerceTransaction,
  CommerceWalletBalance,
  CommerceWalletEnvelope,
} from "../hooks/commerce-wallet.types";

export const COMMERCE_WALLET_ORG_ID = "org-commerce-wallet-demo";

export const COMMERCE_WALLET_CITIES = [
  "Abidjan",
  "Bouaké",
  "Korhogo",
  "San Pedro",
  "Yamoussoukro",
] as const;

function envelope<T>(payload: T): CommerceWalletEnvelope<T> {
  return {
    dataSource: "fallback",
    fallbackUsed: true,
    organizationId: COMMERCE_WALLET_ORG_ID,
    payload,
  };
}

export function mockCommerceWalletBalance(): CommerceWalletEnvelope<CommerceWalletBalance> {
  return envelope({
    organizationId: COMMERCE_WALLET_ORG_ID,
    availableLabel: "1 240 000 FCFA",
    pendingLabel: "186 000 FCFA",
    stabilityNote: "Activité commerciale régulière — flux terrain stable",
    activityLevel: "stable",
    city: "Abidjan",
  });
}

export function mockCommerceTransactions(): CommerceWalletEnvelope<CommerceTransaction[]> {
  return envelope([
    {
      id: "tx1",
      kind: "encaissement",
      label: "Encaissement boutique Plateau",
      partnerName: "Détaillant Plateau",
      amountLabel: "84 200 FCFA",
      status: "settled",
      at: "Aujourd'hui 09:40",
      city: "Abidjan",
      orderId: "o-1042",
      settlementMethod: "cash",
      settlementMode: "CASH_SETTLEMENT",
      settlementReference: "CASH-ABJ-1042",
      actorRole: "detaillant",
    },
    {
      id: "tx2",
      kind: "reglement",
      label: "Règlement producteur — virement",
      partnerName: "Producteur Agro Ouest",
      amountLabel: "312 000 FCFA",
      status: "pending",
      at: "Aujourd'hui 08:15",
      city: "San Pedro",
      orderId: "o-1038",
      settlementMethod: "bank-transfer",
      settlementMode: "BANK_TRANSFER_SETTLEMENT",
      settlementReference: "VIR-SP-1038",
      actorRole: "producteur",
    },
    {
      id: "tx3",
      kind: "paiement-partenaire",
      label: "Semi-grossiste — mobile money",
      partnerName: "Semi-grossiste Nord",
      amountLabel: "56 800 FCFA",
      status: "confirmed",
      at: "Hier 16:20",
      city: "Bouaké",
      settlementMethod: "mobile-money",
      settlementMode: "MOBILE_MONEY_SETTLEMENT",
      settlementReference: "MM-BOU-7781",
      actorRole: "grossiste",
    },
    {
      id: "tx4",
      kind: "commande",
      label: "Commande — règlement hybride",
      partnerName: "Grossiste importateur",
      amountLabel: "128 400 FCFA",
      status: "confirmed",
      at: "Hier 11:00",
      city: "Korhogo",
      orderId: "o-1031",
      settlementMethod: "hybrid",
      settlementMode: "HYBRID_SETTLEMENT",
      terrainNote: "Partie cash + mobile money",
      partnerConfirmationRequired: true,
      actorRole: "grossiste-importateur",
    },
    {
      id: "tx5",
      kind: "encaissement",
      label: "Confirmation terrain hors plateforme",
      partnerName: "Partenaire réseau Yamoussoukro",
      amountLabel: "42 500 FCFA",
      status: "pending",
      at: "Hier 09:30",
      city: "Yamoussoukro",
      settlementMethod: "manual-confirmation",
      settlementMode: "OFF_PLATFORM_SETTLEMENT",
      partnerConfirmationRequired: true,
      actorRole: "partenaire-reseau",
    },
    {
      id: "tx6",
      kind: "reglement",
      label: "Détaillant — cash terrain",
      partnerName: "Boutique Marcory",
      amountLabel: "18 600 FCFA",
      status: "settled",
      at: "Aujourd'hui 07:00",
      city: "Abidjan",
      orderId: "o-1045",
      settlementMethod: "cash",
      settlementMode: "CASH_SETTLEMENT",
      actorRole: "detaillant",
    },
  ]);
}

export function mockCommercePartnerPayments(): CommerceWalletEnvelope<CommercePartnerPayment[]> {
  return envelope([
    {
      id: "pp1",
      partnerName: "Grossiste Plateau",
      partnerRole: "grossiste",
      amountLabel: "186 000 FCFA",
      status: "pending",
      city: "Abidjan",
      note: "Mobile money en attente",
      settlementMethod: "mobile-money",
    },
    {
      id: "pp2",
      partnerName: "Producteur Agro Ouest",
      partnerRole: "producteur",
      amountLabel: "540 000 FCFA",
      status: "confirmed",
      city: "San Pedro",
      note: "Virement bancaire reçu",
      settlementMethod: "bank-transfer",
    },
    {
      id: "pp3",
      partnerName: "Détaillant Korhogo Centre",
      partnerRole: "detaillant",
      amountLabel: "28 400 FCFA",
      status: "settled",
      city: "Korhogo",
      note: "Réglé en cash",
      settlementMethod: "cash",
    },
    {
      id: "pp4",
      partnerName: "Partenaire corridor Bouaké",
      partnerRole: "partenaire-reseau",
      amountLabel: "95 200 FCFA",
      status: "confirmed",
      city: "Bouaké",
      note: "Règlement hybride confirmé",
      settlementMethod: "hybrid",
    },
  ]);
}

export function mockCommercePaymentActivity(): CommerceWalletEnvelope<CommercePaymentActivity[]> {
  return envelope([
    {
      id: "act1",
      text: "Règlement confirmé aujourd'hui — cash Abidjan",
      level: "success",
      at: "Il y a 2 h",
    },
    {
      id: "act2",
      text: "Virement en attente — producteur San Pedro",
      level: "watch",
      at: "Ce matin",
    },
    {
      id: "act3",
      text: "Flux terrain régulier — mobile money Bouaké",
      level: "info",
      at: "Aujourd'hui",
    },
    {
      id: "act4",
      text: "Confirmation partenaire requise — règlement hybride",
      level: "watch",
      at: "Hier",
    },
  ]);
}
