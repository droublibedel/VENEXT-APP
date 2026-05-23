/** Local demo bundle — mirrors core-domain demo shape (Instruction 5 §14). */
export const DEMO_OPERATIONAL_BUNDLE = {
  bbox: { west: -17.6, south: 12.2, east: -11.2, north: 16.9 },
  zones: {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: { tension: 0.82, label: "SN-DKR-01 / tension cell" },
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            [
              [-17.45, 14.65],
              [-15.9, 14.65],
              [-15.9, 15.55],
              [-17.45, 15.55],
              [-17.45, 14.65],
            ],
          ],
        },
      },
      {
        type: "Feature" as const,
        properties: { tension: 0.48, label: "SN-THIES / stable band" },
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            [
              [-16.95, 14.75],
              [-16.2, 14.75],
              [-16.2, 15.25],
              [-16.95, 15.25],
              [-16.95, 14.75],
            ],
          ],
        },
      },
    ],
  },
  routes: {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: { etaRisk: 0.63, anomaly: true, label: "Corridor A" },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [-16.8, 13.2],
            [-15.4, 14.1],
            [-14.2, 15.4],
          ],
        },
      },
    ],
  },
};
