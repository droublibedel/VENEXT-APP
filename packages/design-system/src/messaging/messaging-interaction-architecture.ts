/**
 * Messaging must stay transaction-aware:
 * - pinned product header is non-optional in commerce threads
 * - structured events (qty change, proposal, reservation) render above timeline
 * - voice/image/video/text are transport layers feeding the same contextual model
 */
export const messagingInteractionArchitecture = {
  surfaces: ["pinnedProduct", "negotiationRail", "eventLedger", "thread", "composer"],
  transports: ["text", "voice", "image", "video", "structuredTransaction"],
} as const;
