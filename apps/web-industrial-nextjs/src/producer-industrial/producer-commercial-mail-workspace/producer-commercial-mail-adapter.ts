import type { CommerceMessagingInjectedData } from "commerce-messaging";
import { buildLinkedContextForConversation } from "commerce-messaging";

import type { ProducerMailThread } from "./producer-commercial-mail.types";

/** Maps a mail thread to commerce-messaging injected shape for linked panels (20.66). */
export function producerMailToMessagingInjected(
  thread: ProducerMailThread | null,
): Partial<CommerceMessagingInjectedData> | null {
  if (!thread) return null;
  const conversation = {
    id: thread.id,
    category: "commandes" as const,
    partnerName: thread.partnerName,
    partnerId: thread.partnerId,
    partnerRole: "partenaire réseau",
    recentActivity: thread.preview,
    activityStatus: thread.orderId ? "Commande liée" : "Réseau",
    needsReply: thread.unread,
    city: "Abidjan",
    linkedOrderId: thread.orderId,
    linkedOrderLabel: thread.orderReference,
    productName: thread.productNames?.[0],
  };
  return {
    linkedContextEnabled: true,
    linkedTimelineEnabled: true,
    getLinkedContext: () =>
      thread.linkedContext ??
      buildLinkedContextForConversation({
        conversation,
        order: thread.orderId
          ? {
              orderId: thread.orderId,
              partner: thread.partnerName,
              status: "En cours",
              preparation: "—",
              delivery: "—",
              amountLabel: thread.orderReference ?? "—",
            }
          : null,
      }),
  };
}
