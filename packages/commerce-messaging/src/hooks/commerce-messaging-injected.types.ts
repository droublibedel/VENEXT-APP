import type {
  CommerceMessagingAccountSettings,
  CommerceOrderConversationGovernance,
  CommerceProductConversationSettings,
  ResolvedConversationGovernance,
} from "../governance/commerce-conversation-governance.types";
import type { CommerceHint } from "../intelligence/commerce-messaging-intelligence";
import type { CommerceLinkedContext } from "../linked-commerce/commerce-linked-context.types";
import type {
  CommerceConversation,
  CommerceDataSource,
  CommerceMessage,
  CommerceNetworkStrip,
  CommerceOrderContext,
  CommerceProductContext,
} from "./commerce-messaging.types";

/** Optional injected payload — consumer supplies Grossiste / Producteur data (Instruction 20.59+). */
export type CommerceMessagingInjectedData = {
  conversations: CommerceConversation[];
  getMessages: (conversationId: string) => CommerceMessage[];
  getProductContext: (conversationId: string) => CommerceProductContext | null;
  getOrderContext: (conversationId: string) => CommerceOrderContext | null;
  getNetworkStrip: (conversationId: string) => CommerceNetworkStrip | null;
  extraHints?: CommerceHint[];
  quickSuggestions?: readonly string[];
  dataSource: CommerceDataSource;
  fallbackUsed: boolean;
  loading?: boolean;
  onRefresh?: () => void;
  /** Instruction 20.60 — conversation governance */
  governanceEnabled?: boolean;
  accountSettings?: CommerceMessagingAccountSettings;
  getProductConversationSettings?: (
    conversationId: string,
  ) => CommerceProductConversationSettings | null;
  getOrderConversationGovernance?: (
    conversationId: string,
  ) => CommerceOrderConversationGovernance | null;
  resolveConversationGovernance?: (conversationId: string) => ResolvedConversationGovernance;
  onAccountSettingsChange?: (settings: CommerceMessagingAccountSettings) => void;
  /** Instruction 20.66 — conversation ↔ commande ↔ règlement */
  linkedContextEnabled?: boolean;
  linkedTimelineEnabled?: boolean;
  getLinkedContext?: (conversationId: string) => CommerceLinkedContext | null;
  onLinkedConfirmReceipt?: (conversationId: string) => void;
  /** GROSSISTE-B-03 — contexte produit + audio pour négociation */
  getProductNegotiationContext?: (conversationId: string) => import("terrain-commercial-audio").ProductMessagingContext | null;
};
