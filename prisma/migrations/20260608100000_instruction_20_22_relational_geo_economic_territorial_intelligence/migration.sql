-- Instruction 20.22 — relational geo-economic territorial intelligence (analytical layer, not GPS)

CREATE TYPE "RelationalGeoEconomicZoneType" AS ENUM (
  'METROPOLIS',
  'REGIONAL_HUB',
  'PERIPHERAL',
  'CROSS_BORDER',
  'SPECIAL_ECONOMIC',
  'UNKNOWN'
);

CREATE TYPE "RelationalGeoEconomicPressureLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "RelationalGeoEconomicDensityLevel" AS ENUM ('SPARSE', 'BALANCED', 'CONCENTRATED', 'SATURATED');

CREATE TYPE "RelationalGeoEconomicEventType" AS ENUM (
  'ZONE_PRESSURE_DETECTED',
  'REGIONAL_CLUSTER_CREATED',
  'SYSTEMIC_ZONE_RISK_DETECTED',
  'EXPANSION_POTENTIAL_IDENTIFIED',
  'GEO_ECONOMIC_PROPAGATION_DETECTED',
  'CRITICAL_ZONE_IDENTIFIED',
  'ZONE_ARCHIVED'
);

CREATE TABLE "relational_geo_economic_zones" (
  "id" UUID NOT NULL,
  "zoneCode" TEXT NOT NULL,
  "zoneName" TEXT NOT NULL,
  "zoneType" "RelationalGeoEconomicZoneType" NOT NULL,
  "countryCode" TEXT NOT NULL,
  "regionCode" TEXT NOT NULL,
  "operationalDensityScore" INTEGER NOT NULL DEFAULT 0,
  "economicPressureScore" INTEGER NOT NULL DEFAULT 0,
  "systemicExposureScore" INTEGER NOT NULL DEFAULT 0,
  "expansionPotentialScore" INTEGER NOT NULL DEFAULT 0,
  "fragilityScore" INTEGER NOT NULL DEFAULT 0,
  "corridorCount" INTEGER NOT NULL DEFAULT 0,
  "activeClusterCount" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_geo_economic_zones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_geo_economic_zones_zoneCode_key" UNIQUE ("zoneCode")
);

CREATE INDEX "relational_geo_economic_zones_countryCode_idx" ON "relational_geo_economic_zones"("countryCode");
CREATE INDEX "relational_geo_economic_zones_regionCode_idx" ON "relational_geo_economic_zones"("regionCode");
CREATE INDEX "relational_geo_economic_zones_zoneType_idx" ON "relational_geo_economic_zones"("zoneType");

CREATE TABLE "relational_geo_economic_zone_corridors" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "zoneId" UUID NOT NULL,
  "corridorWeight" DOUBLE PRECISION NOT NULL,
  "operationalDependency" DOUBLE PRECISION NOT NULL,
  "propagationExposure" DOUBLE PRECISION NOT NULL,
  "strategicImportance" DOUBLE PRECISION NOT NULL,
  "metadata" JSONB,
  "diagnostics" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_geo_economic_zone_corridors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_geo_economic_zone_corridors_relationshipId_zoneId_key" UNIQUE ("relationshipId", "zoneId"),
  CONSTRAINT "relational_geo_economic_zone_corridors_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_geo_economic_zone_corridors_zoneId_fkey"
    FOREIGN KEY ("zoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relational_geo_economic_zone_corridors_relationshipId_idx"
  ON "relational_geo_economic_zone_corridors"("relationshipId");
CREATE INDEX "relational_geo_economic_zone_corridors_zoneId_idx"
  ON "relational_geo_economic_zone_corridors"("zoneId");

CREATE TABLE "relational_geo_economic_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID,
  "zoneId" UUID,
  "eventType" "RelationalGeoEconomicEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_geo_economic_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_geo_economic_events_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "relational_geo_economic_events_zoneId_fkey"
    FOREIGN KEY ("zoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "relational_geo_economic_events_relationshipId_idx" ON "relational_geo_economic_events"("relationshipId");
CREATE INDEX "relational_geo_economic_events_zoneId_idx" ON "relational_geo_economic_events"("zoneId");
CREATE INDEX "relational_geo_economic_events_eventType_idx" ON "relational_geo_economic_events"("eventType");
CREATE INDEX "relational_geo_economic_events_createdAt_idx" ON "relational_geo_economic_events"("createdAt");
