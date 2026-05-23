/** Mapbox GL integration contract — style URLs resolved at runtime per tenant */
export interface MapViewportFoundation {
  center: [number, number];
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface GeoLayerBinding {
  layerId: string;
  sourceId: string;
  /** Industrial / logistics poles attach telemetry overlays */
  telemetryChannel?: string;
}
