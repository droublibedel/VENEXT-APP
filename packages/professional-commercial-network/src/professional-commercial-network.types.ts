export type ProfessionalActorRole = "producteur" | "grossiste_a";

export type ProfessionalDataSource = "live" | "fallback" | "mixed";

export type ProfessionalPartnerStatus =
  | "invited"
  | "pending_validation"
  | "active"
  | "suspended";

export type ProfessionalNetworkPanelId =
  | "directory"
  | "invitation"
  | "validation"
  | "agreements"
  | "territory"
  | "activity"
  | "documents"
  | "orders"
  | "settlements"
  | "mail"
  | "insights";

export type ProfessionalPartner = {
  id: string;
  companyName: string;
  contactName: string;
  activityType: string;
  city: string;
  status: ProfessionalPartnerStatus;
  coverageLabel: string;
  productCategories: string[];
  stabilityLabel: string;
  lastActivity: string;
  restrictedCatalog: boolean;
};

export type ProfessionalCommercialDocument = {
  id: string;
  name: string;
  kind: "pdf" | "xlsx" | "docx" | "csv" | "png" | "jpg";
  sizeLabel: string;
  at: string;
  category: string;
};

export type ProfessionalMailThreadSummary = {
  id: string;
  subject: string;
  partnerId: string;
  at: string;
  preview: string;
  orderReference?: string;
  settlementReference?: string;
};

export type ProfessionalLinkedOrder = {
  id: string;
  reference: string;
  status: string;
  amountLabel: string;
};

export type ProfessionalLinkedSettlement = {
  id: string;
  reference: string;
  amountLabel: string;
  method: string;
};

export type ProfessionalTerritoryView = {
  cities: string[];
  corridors: string[];
  activeZones: string[];
  stabilityNote: string;
};

export type ProfessionalCommercialAgreement = {
  id: string;
  label: string;
  status: "draft" | "active" | "review";
  validUntil?: string;
};

export type ProfessionalNetworkView = {
  partners: ProfessionalPartner[];
  closedNetworkNotice: string;
  documents: ProfessionalCommercialDocument[];
  mailThreads: ProfessionalMailThreadSummary[];
  orders: ProfessionalLinkedOrder[];
  settlements: ProfessionalLinkedSettlement[];
  territory: ProfessionalTerritoryView;
  agreements: ProfessionalCommercialAgreement[];
  activitySummary: string;
};

export type ProfessionalNetworkInjected = {
  view: ProfessionalNetworkView | null;
  dataSource: ProfessionalDataSource;
  fallbackUsed: boolean;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  onInvite?: (payload: { partnerId?: string; message: string }) => void;
  onValidate?: (partnerId: string) => void;
  onReject?: (partnerId: string) => void;
  onOpenMail?: (threadId: string) => void;
  onOpenMessaging?: (partnerId: string) => void;
};

export type ProfessionalNetworkFlags = {
  professional_commercial_network_enabled?: boolean;
  producer_partner_network_enabled?: boolean;
  grossiste_a_partner_network_enabled?: boolean;
};

export type ProfessionalNetworkGovernance = {
  invitationRequired: boolean;
  validationRequired: boolean;
  restrictedCatalog: boolean;
  documentExchangeAllowed: boolean;
  territoryControlled: boolean;
  directMailAllowed: boolean;
  autoAcceptForbidden: true;
  notice?: string;
};

export type ProfessionalCommercialNetworkShellProps = {
  actorRole: ProfessionalActorRole;
  enabled?: boolean;
  injected?: ProfessionalNetworkInjected;
  flags?: ProfessionalNetworkFlags;
  contextRouting?: import("commercial-context-routing").CommercialContextRoutingInput;
};
