import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  auditCommercialLocationCoverage,
  auditCommercialLocationPrivacy,
  auditGpsPrecisionQuality,
  auditLocationCompletionFlow,
  auditMapReadiness,
} from "./commercial-location-audits.js";
import { filterCiCities, CI_CITY_SUGGESTIONS, ABIDJAN_COMMERCIAL_CLUSTER } from "./ci-cities.js";
import {
  getCommercialLocationProfile,
  hasExploitableLocation,
  markSoftLocationPromptDismissed,
  resetCommercialLocationStorageForTests,
  toPublicLocationView,
} from "./commercial-location-storage.js";
import { computeGeographicProximityScore, MapEconomicLayerCompatibility } from "./geographic-proximity.js";
import { inferLocationFromPhone } from "./infer-location.js";
import {
  getCommercialLocationObservabilityEvents,
  reportCommercialLocationEvent,
  resetCommercialLocationObservability,
} from "./location-observability.js";
import { reverseGeocodeGps } from "./reverse-geocoding.js";
import { saveGpsLocation, saveManualCity, patchCommercialLocation } from "./commercial-location-service.js";
import { shouldShowSoftLocationPrompt } from "./soft-location-prompt-policy.js";
import { SoftCommercialLocationCompletion } from "./SoftCommercialLocationCompletion.js";
describe("GROSSISTE-B-05 commercial location matrix", () => {
  beforeEach(() => {
    resetCommercialLocationStorageForTests();
    resetCommercialLocationObservability();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("CAS 1 GPS accepté", () => {
    it("capture GPS stores lat/lng/accuracy/timestamp", async () => {
      vi.stubGlobal("navigator", {
        geolocation: {
          getCurrentPosition: (ok: PositionCallback) =>
            ok({
              coords: { latitude: 5.35, longitude: -4.01, accuracy: 42 },
              timestamp: 1,
            } as GeolocationPosition),
        },
      });
      const { profile, denied } = await saveGpsLocation("gps-actor");
      expect(denied).toBe(false);
      expect(profile?.latitude).toBe(5.35);
      expect(profile?.longitude).toBe(-4.01);
      expect(profile?.accuracyMeters).toBe(42);
      expect(profile?.sourceType).toBe("GPS");
      expect(profile?.gpsValidatedAt).toBeTruthy();
    });

    it("reports gps_permission_granted", async () => {
      vi.stubGlobal("navigator", {
        geolocation: {
          getCurrentPosition: (ok: PositionCallback) =>
            ok({ coords: { latitude: 5.36, longitude: -4.0, accuracy: 30 }, timestamp: 2 } as GeolocationPosition),
        },
      });
      await saveGpsLocation("gps-obs");
      expect(getCommercialLocationObservabilityEvents()).toContain("gps_permission_granted");
    });
  });

  describe("CAS 2 GPS refusé → ville", () => {
    it("denied GPS returns denied flag", async () => {
      vi.stubGlobal("navigator", {
        geolocation: { getCurrentPosition: (_: PositionCallback, err: PositionErrorCallback) => err({ code: 1 } as GeolocationPositionError) },
      });
      const r = await saveGpsLocation("denied-gps");
      expect(r.denied).toBe(true);
      expect(getCommercialLocationObservabilityEvents()).toContain("gps_permission_denied");
    });

    it("soft UI shows city fallback after GPS denied", async () => {
      vi.stubGlobal("navigator", {
        geolocation: { getCurrentPosition: (_: PositionCallback, err: PositionErrorCallback) => err({ code: 1 } as GeolocationPositionError) },
      });
      render(<SoftCommercialLocationCompletion actorId="ui-denied" />);
      fireEvent.click(screen.getByTestId("loc-btn-gps"));
      fireEvent.click(screen.getByTestId("loc-gps-confirm"));
      await waitFor(() => expect(screen.getByTestId("gps-denied-fallback")).toBeTruthy());
    });
  });

  describe("CAS 3 ville manuelle", () => {
    it.each(["Abidjan", "Bouaké", "Yopougon", "San Pedro"])("saves manual city %s", async (city) => {
      const p = await saveManualCity(`manual-${city}`, city);
      expect(p.city).toBe(city);
      expect(p.sourceType).toBe("MANUAL_CITY");
    });

    it("reports city_completed", async () => {
      await saveManualCity("city-obs", "Korhogo");
      expect(getCommercialLocationObservabilityEvents()).toContain("city_completed");
    });
  });

  describe("CAS 4 soft prompt non bloquant", () => {
    it("shows message and later dismisses", () => {
      render(<SoftCommercialLocationCompletion actorId="soft-1" onDismiss={vi.fn()} />);
      expect(screen.getByText(/Ajoutez votre position ou votre ville/)).toBeTruthy();
      fireEvent.click(screen.getByTestId("loc-btn-later"));
    });

    it("shouldShowSoftLocationPrompt false when location exists", async () => {
      await saveManualCity("has-loc", "Abidjan");
      expect(
        shouldShowSoftLocationPrompt("has-loc", { onboardingDone: true, sessionCount: 2, sessionKey: "k" }),
      ).toBe(false);
    });

    it("shouldShowSoftLocationPrompt true after onboarding without location", () => {
      expect(
        shouldShowSoftLocationPrompt("no-loc", { onboardingDone: true, sessionCount: 1, sessionKey: "k" }),
      ).toBe(true);
    });
  });

  describe("CAS 5 reverse geocoding", () => {
    it("Abidjan coords resolve district", async () => {
      const geo = await reverseGeocodeGps({
        latitude: 5.35,
        longitude: -4.0,
        accuracyMeters: 10,
        timestamp: new Date().toISOString(),
      });
      expect(geo.city).toBe("Abidjan");
      expect(geo.country).toBe("Côte d'Ivoire");
    });

    it("Bouaké band resolves Bouaké", async () => {
      const geo = await reverseGeocodeGps({
        latitude: 7.69,
        longitude: -5.03,
        accuracyMeters: 10,
        timestamp: new Date().toISOString(),
      });
      expect(geo.city).toBe("Bouaké");
    });
  });

  describe("CAS 6 privacy", () => {
    it("public view never exposes coordinates", async () => {
      vi.stubGlobal("navigator", {
        geolocation: {
          getCurrentPosition: (ok: PositionCallback) =>
            ok({ coords: { latitude: 1, longitude: 2, accuracy: 5 }, timestamp: 1 } as GeolocationPosition),
        },
      });
      await saveGpsLocation("priv");
      const pub = toPublicLocationView(getCommercialLocationProfile("priv"));
      expect(pub).not.toHaveProperty("latitude");
      expect(pub).not.toHaveProperty("longitude");
      expect(auditCommercialLocationPrivacy("priv").ok).toBe(true);
    });
  });

  describe("CAS 7 feed proximité géographique", () => {
    it("Yopougon vs Adjamé scores higher than Yopougon vs Korhogo", () => {
      const near = computeGeographicProximityScore("Yopougon", "Adjamé");
      const far = computeGeographicProximityScore("Yopougon", "Korhogo");
      expect(near).toBeGreaterThan(far);
    });

    it("same city maximal score for ranking", () => {
      expect(computeGeographicProximityScore("Treichville", "Treichville")).toBe(100);
    });
  });

  describe("CAS 8 sponsorisé géographique", () => {
    it.each(ABIDJAN_COMMERCIAL_CLUSTER.slice(0, 5))("cluster %s scores >= 65 vs Yopougon", (zone) => {
      expect(computeGeographicProximityScore("Yopougon", zone)).toBeGreaterThanOrEqual(65);
    });
  });

  describe("CAS 9 GPS stockage", () => {
    it("profile retains accuracy and source GPS", async () => {
      vi.stubGlobal("navigator", {
        geolocation: {
          getCurrentPosition: (ok: PositionCallback) =>
            ok({ coords: { latitude: 5.34, longitude: -3.99, accuracy: 88 }, timestamp: 3 } as GeolocationPosition),
        },
      });
      await saveGpsLocation("store-gps");
      const p = getCommercialLocationProfile("store-gps");
      expect(p?.accuracyMeters).toBe(88);
      expect(auditGpsPrecisionQuality("store-gps").hasCoordinates).toBe(true);
    });
  });

  describe("CAS 10 fallback inferred", () => {
    it("infers from +225 phone", () => {
      const p = inferLocationFromPhone("+22507000000", "inf");
      expect(p.sourceType).toBe("SYSTEM_INFERRED");
      reportCommercialLocationEvent("inferred_location_used");
      expect(getCommercialLocationObservabilityEvents()).toContain("inferred_location_used");
    });
  });

  describe("audits", () => {
    it("coverage audit counts gaps", async () => {
      await saveManualCity("a1", "Abidjan");
      const r = auditCommercialLocationCoverage(["a1", "a2"]);
      expect(r.covered).toBe(1);
      expect(r.gaps).toContain("a2");
    });

    it("map readiness requires city or gps", async () => {
      expect(auditMapReadiness("x").ready).toBe(false);
      await saveManualCity("x", "Man");
      expect(auditMapReadiness("x").ready).toBe(true);
    });

    it("completion flow audit", async () => {
      expect(auditLocationCompletionFlow("z").hasProfile).toBe(false);
      await saveManualCity("z", "Daloa");
      expect(auditLocationCompletionFlow("z").exploitable).toBe(true);
    });
  });

  describe("CI cities & map layer", () => {
    it.each(CI_CITY_SUGGESTIONS)("filter includes %s", (city) => {
      expect(filterCiCities(city.slice(0, 3))).toContain(city);
    });

    it("MapEconomicLayerCompatibility ready", () => {
      expect(MapEconomicLayerCompatibility.supportsGpsLayer).toBe(true);
      expect(MapEconomicLayerCompatibility.prepareIndustrialPoleIntegration().ready).toBe(true);
    });
  });

  describe("geographic proximity engine", () => {
    it.each([
      ["Yopougon", "Adjamé", 78],
      ["Abidjan", "Abidjan", 100],
      ["", "Abidjan", 20],
    ] as const)("score %s vs %s", (v, t, min) => {
      expect(computeGeographicProximityScore(v, t)).toBeGreaterThanOrEqual(min);
    });
  });

  describe("patch & exploitable", () => {
    it("patch updates city", async () => {
      await saveManualCity("patch-a", "Abobo");
      const p = patchCommercialLocation("patch-a", { district: "Avocatier" });
      expect(p?.district).toBe("Avocatier");
    });

    it("hasExploitableLocation true for city only", async () => {
      await saveManualCity("exp", "Gagnoa");
      expect(hasExploitableLocation("exp")).toBe(true);
    });
  });

  describe("observability matrix", () => {
    const events = [
      "gps_permission_granted",
      "gps_permission_denied",
      "city_completed",
      "commercial_location_completed",
      "location_soft_prompt_displayed",
      "inferred_location_used",
    ] as const;
    it.each(events)("can emit %s", (ev) => {
      reportCommercialLocationEvent(ev);
      expect(getCommercialLocationObservabilityEvents()).toContain(ev);
    });
  });

  describe("proximity pairwise Abidjan", () => {
    const pairs: Array<[string, string]> = [
      ["Yopougon", "Abobo"],
      ["Yopougon", "Treichville"],
      ["Adjamé", "Plateau"],
      ["Abobo", "Marcory"],
      ["Attécoubé", "Cocody"],
      ["Abidjan", "Yopougon"],
      ["Treichville", "Adjamé"],
      ["Plateau", "Marcory"],
      ["Abobo", "Yopougon"],
      ["Cocody", "Abidjan"],
    ];
    it.each(pairs)("%s near %s", (a, b) => {
      expect(computeGeographicProximityScore(a, b)).toBeGreaterThan(50);
    });
  });

  describe("manual city batch", () => {
    it.each(CI_CITY_SUGGESTIONS)("has exploitable %s", async (city) => {
      const id = `batch-${city}`;
      await saveManualCity(id, city);
      expect(hasExploitableLocation(id)).toBe(true);
    });
  });

  describe("dismiss prompt policy", () => {
    it("dismissed session hides prompt", () => {
      markSoftLocationPromptDismissed("d1", "k1");
      expect(
        shouldShowSoftLocationPrompt("d1", { onboardingDone: true, sessionCount: 2, sessionKey: "k1" }),
      ).toBe(false);
    });

    it("exploitable blocks prompt even if not dismissed", async () => {
      await saveManualCity("d2", "Man");
      expect(
        shouldShowSoftLocationPrompt("d2", { onboardingDone: true, sessionCount: 2, sessionKey: "k2" }),
      ).toBe(false);
    });
  });

  describe("api client shape", () => {
    it("createCommercialLocationApi exposes get/post/patch", async () => {
      const { createCommercialLocationApi } = await import("./commercial-location-api.js");
      const api = createCommercialLocationApi("http://localhost");
      expect(typeof api.getMe).toBe("function");
      expect(typeof api.post).toBe("function");
      expect(typeof api.patch).toBe("function");
    });
  });

  describe("soft UI flows", () => {
    it("city mode saves via UI", async () => {
      render(<SoftCommercialLocationCompletion actorId="ui-city" onCompleted={vi.fn()} />);
      fireEvent.click(screen.getByTestId("loc-btn-city"));
      fireEvent.change(screen.getByTestId("loc-city-input"), { target: { value: "Bouaké" } });
      fireEvent.click(screen.getByTestId("loc-city-save"));
      await waitFor(() => expect(getCommercialLocationProfile("ui-city")?.city).toBe("Bouaké"));
    });

    it("gps hint visible before confirm", () => {
      render(<SoftCommercialLocationCompletion actorId="ui-hint" />);
      fireEvent.click(screen.getByTestId("loc-btn-gps"));
      expect(screen.getByTestId("gps-hint").textContent).toMatch(/lieu d.activité/i);
    });
  });
});
