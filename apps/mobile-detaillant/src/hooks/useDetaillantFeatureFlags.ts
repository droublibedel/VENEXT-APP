import { useEffect, useState } from "react";

export type DetaillantFlagsState = Record<string, boolean | undefined>;

const IS_PRODUCTION = typeof import.meta !== "undefined" && import.meta.env?.PROD === true;

const PRODUCTION_DEFAULTS: DetaillantFlagsState = {
  detaillant_mobile_enabled: false,
  detaillant_live_data_enabled: false,
  detaillant_commerce_messaging_enabled: false,
  detaillant_wallet_enabled: false,
  commerce_conversation_governance_enabled: false,
  commerce_linked_context_enabled: false,
  commerce_linked_timeline_enabled: false,
  commercial_network_discovery_enabled: false,
  commercial_auto_accept_enabled: false,
  commercial_contact_first_identity_enabled: false,
  commercial_activity_based_suggestions_enabled: false,
  relational_catalog_enabled: false,
  sponsored_catalog_discovery_enabled: false,
  partner_catalog_visibility_enabled: false,
  terrain_quick_onboarding_enabled: false,
  terrain_pseudo_identity_enabled: false,
  relational_order_orchestration_enabled: false,
  commercial_delivery_flow_enabled: false,
  commercial_reception_confirmation_enabled: false,
  commercial_delivery_activity_enabled: false,
  commercial_settlement_flow_enabled: false,
  commerce_foundation_guardrails_enabled: false,
  commerce_navigation_consistency_enabled: false,
  commerce_anti_erp_wording_enabled: false,
  commercial_relationship_governance_enabled: false,
  commercial_multi_level_network_enabled: false,
  commercial_relationship_context_enabled: false,
  commercial_context_routing_enabled: false,
  commercial_context_history_enabled: false,
  commercial_cross_module_navigation_enabled: false,
  venext_i18n_enabled: false,
  venext_rtl_enabled: false,
  venext_multilingual_guardrails_enabled: false,
  venext_auth_foundation_enabled: false,
  venext_session_restore_enabled: false,
  venext_profile_foundation_enabled: false,
  terrain_unlimited_session_enabled: false,
  wallet_adaptive_security_enabled: false,
  wallet_bceao_kyc_enabled: false,
  wallet_biometric_unlock_enabled: false,
  wallet_instant_background_lock_enabled: false,
  wallet_ultra_short_timeout_enabled: false,
  venext_backend_persistence_enabled: false,
  venext_bff_routes_enabled: false,
  venext_live_data_fallback_enabled: false,
  commerce_notifications_enabled: false,
  commerce_notification_preferences_enabled: false,
  commerce_notification_context_routing_enabled: false,
  commercial_activity_feed_enabled: false,
  commercial_activity_timeline_enabled: false,
  commercial_activity_grouping_enabled: false,
  commerce_offline_foundation_enabled: false,
  commerce_offline_sync_enabled: false,
  commerce_offline_queue_enabled: false,
  commerce_access_control_enabled: false,
  commerce_visibility_guard_enabled: false,
  commerce_backend_access_guard_enabled: false,
  commerce_ux_harmony_enabled: false,
  commerce_performance_foundation_enabled: false,
  commerce_secure_cleanup_enabled: false,
  commerce_light_virtualization_enabled: false,
  commerce_secure_wallet_navigation_enabled: false,
  commerce_humanized_errors_enabled: false,
};

const DEV_DEFAULTS: DetaillantFlagsState = {
  detaillant_mobile_enabled: true,
  detaillant_live_data_enabled: true,
  detaillant_commerce_messaging_enabled: true,
  detaillant_wallet_enabled: true,
  commerce_conversation_governance_enabled: true,
  commerce_linked_context_enabled: true,
  commerce_linked_timeline_enabled: true,
  commercial_network_discovery_enabled: true,
  commercial_auto_accept_enabled: true,
  commercial_contact_first_identity_enabled: true,
  commercial_activity_based_suggestions_enabled: true,
  relational_catalog_enabled: true,
  sponsored_catalog_discovery_enabled: true,
  partner_catalog_visibility_enabled: true,
  terrain_quick_onboarding_enabled: true,
  terrain_pseudo_identity_enabled: true,
  relational_order_orchestration_enabled: true,
  commercial_delivery_flow_enabled: true,
  commercial_reception_confirmation_enabled: true,
  commercial_delivery_activity_enabled: true,
  commercial_settlement_flow_enabled: true,
  commerce_foundation_guardrails_enabled: true,
  commerce_navigation_consistency_enabled: true,
  commerce_anti_erp_wording_enabled: true,
  commercial_relationship_governance_enabled: true,
  commercial_multi_level_network_enabled: true,
  commercial_relationship_context_enabled: true,
  commercial_context_routing_enabled: true,
  commercial_context_history_enabled: true,
  commercial_cross_module_navigation_enabled: true,
  venext_i18n_enabled: true,
  venext_rtl_enabled: true,
  venext_multilingual_guardrails_enabled: true,
  venext_auth_foundation_enabled: true,
  venext_session_restore_enabled: true,
  venext_profile_foundation_enabled: true,
  terrain_unlimited_session_enabled: true,
  wallet_adaptive_security_enabled: true,
  wallet_bceao_kyc_enabled: true,
  wallet_biometric_unlock_enabled: true,
  wallet_instant_background_lock_enabled: true,
  wallet_ultra_short_timeout_enabled: true,
  venext_backend_persistence_enabled: true,
  venext_bff_routes_enabled: true,
  venext_live_data_fallback_enabled: true,
  commerce_notifications_enabled: true,
  commerce_notification_preferences_enabled: true,
  commerce_notification_context_routing_enabled: true,
  commercial_activity_feed_enabled: true,
  commercial_activity_timeline_enabled: true,
  commercial_activity_grouping_enabled: true,
  commerce_offline_foundation_enabled: true,
  commerce_offline_sync_enabled: true,
  commerce_offline_queue_enabled: true,
  commerce_access_control_enabled: true,
  commerce_visibility_guard_enabled: true,
  commerce_backend_access_guard_enabled: true,
  commerce_ux_harmony_enabled: true,
  commerce_performance_foundation_enabled: true,
  commerce_secure_cleanup_enabled: true,
  commerce_light_virtualization_enabled: true,
  commerce_secure_wallet_navigation_enabled: true,
  commerce_humanized_errors_enabled: true,
};

const DEFAULTS = IS_PRODUCTION ? PRODUCTION_DEFAULTS : DEV_DEFAULTS;

export function useDetaillantFeatureFlags() {
  const [flags, setFlags] = useState<DetaillantFlagsState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/feature-flags", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { flags?: Record<string, boolean>; payload?: { key: string; enabled: boolean }[] } | null) => {
        if (cancelled) return;
        const payloadFlags = Object.fromEntries(
          (body?.payload ?? []).map((flag) => [flag.key, flag.enabled]),
        );
        setFlags({ ...DEFAULTS, ...payloadFlags, ...(body?.flags ?? {}) });
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) {
          setFlags(DEFAULTS);
          setHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { flags, hydrated };
}
