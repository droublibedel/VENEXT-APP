export type CommerceWalletDataSource = "live" | "fallback" | "mixed";

export type WalletActorRole =
  | "producteur"
  | "grossiste-importateur"
  | "grossiste"
  | "detaillant"
  | "partenaire-reseau";

export type PaymentStatus = "pending" | "confirmed" | "settled" | "failed";

export type TransactionKind = "encaissement" | "reglement" | "paiement-partenaire" | "commande";

export type CommerceWalletBalance = {
  organizationId: string;
  availableLabel: string;
  pendingLabel: string;
  stabilityNote: string;
  activityLevel: "stable" | "active" | "watch";
  city: string;
};

export type CommerceTransaction = {
  id: string;
  kind: TransactionKind;
  label: string;
  partnerName?: string;
  amountLabel: string;
  status: PaymentStatus;
  at: string;
  city: string;
  orderId?: string;
  settlementMethod?: import("../settlements/commerce-settlement.types").SettlementMethod;
  settlementMode?: import("../governance/commerce-wallet-governance.types").WalletMode;
  settlementReference?: string;
  terrainNote?: string;
  partnerConfirmationRequired?: boolean;
  actorRole?: WalletActorRole;
};

export type CommercePartnerPayment = {
  id: string;
  partnerName: string;
  partnerRole: WalletActorRole;
  amountLabel: string;
  status: PaymentStatus;
  city: string;
  note?: string;
  settlementMethod?: import("../settlements/commerce-settlement.types").SettlementMethod;
};

export type CommercePaymentActivity = {
  id: string;
  text: string;
  level: "info" | "success" | "watch";
  at: string;
};

export type CommerceWalletPanel = "overview" | "transactions" | "payments" | "partners";

export type CommerceWalletBffEndpoint = "balance" | "transactions" | "payments" | "activity";

export type CommerceWalletEnvelope<T> = {
  dataSource: CommerceWalletDataSource;
  fallbackUsed: boolean;
  organizationId: string;
  payload: T;
};

export type CommerceWalletLiveState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  dataSource: CommerceWalletDataSource;
  fallbackUsed: boolean;
  refresh: () => void;
};
