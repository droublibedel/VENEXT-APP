/**
 * Map control doctrine:
 * - Layered toggles for logistics / industrial monitoring / regional heat
 * - Legends stay anchored; realtime strip never occludes primary controls
 * - Map-linked contextual zones bind selection to product / corridor context
 */
export const mapInteractionArchitecture = {
  overlayPlanes: ["logistics", "industrialMonitor", "economicHeat", "alerts"],
  selectionBinding: "contextualZoneToCatalogScope",
} as const;
