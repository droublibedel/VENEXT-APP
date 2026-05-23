/** Mapping événements live → clés parcours canoniques back-office. */
const LIVE_TO_CANONICAL: Record<string, string> = {
  login_start: "login",
  login_success: "login",
  login_failure: "login",
  otp_request: "login",
  otp_failure: "login",
  otp_success: "login",
  onboarding_started: "terrain_onboarding",
  onboarding_completed: "terrain_onboarding",
  onboarding_abandoned: "terrain_onboarding",
  onboarding_blocked: "terrain_onboarding",
  product_create_started: "create_product",
  product_create_failed: "create_product",
  product_create_completed: "create_product",
  order_create_started: "create_order",
  order_create_failed: "create_order",
  order_create_completed: "create_order",
  wallet_activation_started: "wallet_activation",
  wallet_activation_failed: "wallet_activation",
  wallet_activation_completed: "wallet_activation",
  relationship_invitation_sent: "enterprise_invitation",
  relationship_accept_failed: "enterprise_invitation",
  relationship_accept_completed: "enterprise_invitation",
  enterprise_invitation_started: "enterprise_invitation",
  enterprise_invitation_completed: "enterprise_invitation",
  enterprise_invitation_abandoned: "enterprise_invitation",
  reset_password_start: "login",
  reset_password_success: "login",
  product_form_open: "create_product",
  product_draft_saved: "create_product",
  product_image_upload: "create_product",
  product_edit_started: "create_product",
  product_edit_completed: "create_product",
  order_validated: "create_order",
  order_refused: "create_order",
  order_cancelled: "create_order",
  wallet_payment: "wallet_activation",
  wallet_payment_failed: "wallet_activation",
  wallet_withdraw: "wallet_activation",
  wallet_topup: "wallet_activation",
  conversation_open: "send_message",
  message_sent: "send_message",
  negotiation_started: "send_message",
  commercial_proposal_sent: "send_message",
  relationship_reject_completed: "enterprise_invitation",
  pole_dashboard_view: "pole_activation",
  industrial_signal_read: "pole_activation",
  industrial_analytics_view: "pole_activation",
  industrial_report_export: "pole_activation",
  backoffice_login_success: "login",
  support_ticket_open: "send_message",
  governance_action: "enterprise_invitation",
  feature_flag_change: "pole_activation",
  journey_abandoned: "terrain_onboarding",
};

export function canonicalJourneyKeyForLiveEvent(eventKey: string): string {
  return LIVE_TO_CANONICAL[eventKey] ?? eventKey;
}

export function journeyStatusFromLiveEvent(eventKey: string): string {
  if (eventKey.endsWith("_completed") || eventKey.endsWith("_success")) return "COMPLETED";
  if (eventKey.endsWith("_abandoned")) return "ABANDONED";
  if (eventKey.endsWith("_failed") || eventKey.endsWith("_blocked") || eventKey.endsWith("_failure")) {
    return "BLOCKED";
  }
  if (eventKey.endsWith("_started")) return "IN_PROGRESS";
  return "IN_PROGRESS";
}
