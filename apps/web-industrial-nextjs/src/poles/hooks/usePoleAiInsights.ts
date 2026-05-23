"use client";

import { useCallback, useEffect, useState } from "react";

import {
  humanizeIndustrialCaught,
  humanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

import type { PoleSlug } from "../types";

export type PoleInsightBundle = {
  provider: string;
  poleSlug: string;
  strategicSummary: string;
  operationalWarnings: string[];
  opportunitySignals: string[];
  recommendations: string[];
  forecastIndicators: { label: string; horizon: string; confidence: number }[];
};

type DemoBundle = {
  zones?: unknown;
  routes?: unknown;
  stockTension?: { sku: string; zone?: string; tension: number }[];
  paymentDelays?: { zone: string; pressure: number }[];
  demandSpikes?: { zone: string; spike: number; driver?: string }[];
  emergencyEvents?: { priority?: string }[];
};

export function usePoleAiInsights({
  poleSlug,
  enabled,
  refreshToken,
  zoneCode = "SN-DKR-01",
}: {
  poleSlug: PoleSlug;
  enabled: boolean;
  refreshToken: number;
  zoneCode?: string;
}) {
  const [bundle, setBundle] = useState<PoleInsightBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setBundle(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let demo: DemoBundle = {};
      const dr = await fetch(`/api/core/v1/poles/demo-operational/${poleSlug}`);
      if (dr.ok) {
        demo = (await dr.json()) as DemoBundle;
      }

      const stockMovement = demo.stockTension?.map((s) => ({
        sku: s.sku,
        tension: s.tension,
      }));
      const pending = Math.min(
        24,
        Math.round((demo.demandSpikes?.length ?? 2) * 5 + (demo.stockTension?.length ?? 0) * 3),
      );
      const blocked = Math.min(
        8,
        (demo.emergencyEvents?.filter((e) => e.priority === "HIGH").length ?? 0) * 2,
      );

      const body = {
        zoneCode,
        stockMovement,
        orders: { pending, blocked },
        economicEvents: (demo.demandSpikes ?? []).map((d) => ({
          label: `${d.zone}:${d.driver ?? "spike"}`,
          weight: d.spike,
        })),
        internalSignals: (demo.paymentDelays ?? []).map((p) => ({
          type: "payment_pressure",
          intensity: p.pressure,
          zone: p.zone,
        })),
        relationshipActivity: { delta: (demo.stockTension?.[0]?.tension ?? 0.4) - 0.35 },
      };

      const ar = await fetch(`/api/ai/v1/ai/poles/${poleSlug}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!ar.ok) {
        throw new Error(humanizedHttpFailure(ar.status));
      }
      setBundle((await ar.json()) as PoleInsightBundle);
    } catch (e) {
      setError(humanizeIndustrialCaught(e, { fallbackKey: "server_error" }));
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, poleSlug, refreshToken, zoneCode]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bundle, loading, error };
}
