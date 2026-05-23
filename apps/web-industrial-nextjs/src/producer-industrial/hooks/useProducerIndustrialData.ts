"use client";

import { useMemo } from "react";

import {
  PRODUCER_ALERTS,
  PRODUCER_EXECUTIVE_SUMMARY,
  PRODUCER_FINANCE_SUMMARY,
  PRODUCER_INTELLIGENCE_INSIGHTS,
  PRODUCER_PRODUCT_SIGNALS,
  PRODUCER_RECENT_PARTNERS,
  PRODUCER_REGIONS,
  PRODUCER_SUPPLY_SUMMARY,
  PRODUCER_TOP_WHOLESALERS,
} from "../mocks/industrial-mock-data";

/** Stable mock bundle for producer cockpit — no API yet (20.45 foundation). */
export function useProducerIndustrialData() {
  return useMemo(
    () => ({
      regions: PRODUCER_REGIONS,
      executive: PRODUCER_EXECUTIVE_SUMMARY,
      supply: PRODUCER_SUPPLY_SUMMARY,
      finance: PRODUCER_FINANCE_SUMMARY,
      topWholesalers: PRODUCER_TOP_WHOLESALERS,
      recentPartners: PRODUCER_RECENT_PARTNERS,
      products: PRODUCER_PRODUCT_SIGNALS,
      insights: PRODUCER_INTELLIGENCE_INSIGHTS,
      alerts: PRODUCER_ALERTS,
    }),
    [],
  );
}
